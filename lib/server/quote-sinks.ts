import type { QuoteRequest } from "@/types/quote";
import { reportError } from "@/lib/observability";

/**
 * WHERE AN RFQ GOES
 * --------------------------------------------------------------------
 * Two kinds of destination, deliberately separated:
 *
 *   STORE   durable persistence. The record survives.
 *   NOTIFY  a nudge to a human — email, webhook, chat.
 *
 * Success is decided by the STORE, never by a notification. An email
 * that bounces must not lose an RFQ, and an email that sends must not
 * make an unsaved RFQ look saved.
 *
 * When no store is configured but a notifier is, the notifier becomes
 * the delivery mechanism and must succeed — because there is nothing
 * else holding the request. `deliverQuote` implements exactly that.
 *
 * PROVIDER NEUTRAL: nothing here imports a vendor SDK. A webhook covers
 * Zapier/n8n/Make/a custom API today; a Supabase or Postgres adapter is
 * a ~15 line function implementing `QuoteStore`. Sketches at the bottom.
 */

export interface QuoteStore {
  readonly name: string;
  /** Persist the request. Throw to fail — the caller reports failure. */
  save(request: QuoteRequest): Promise<void>;
}

export interface QuoteNotifier {
  readonly name: string;
  notify(request: QuoteRequest): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

const env = (key: string): string => (process.env[key] ?? "").trim();

const withTimeout = async (input: RequestInfo, init: RequestInit, ms = 8_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

/* ------------------------------------------------------------------ */
/* Stores                                                              */
/* ------------------------------------------------------------------ */

/**
 * POSTs the record to a URL you control. The simplest durable option:
 * point it at your own API, a database function, or an automation that
 * writes to a sheet or CRM.
 */
function webhookStore(url: string): QuoteStore {
  return {
    name: "webhook",
    async save(request) {
      const res = await withTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(env("QUOTE_WEBHOOK_SECRET")
            ? { Authorization: `Bearer ${env("QUOTE_WEBHOOK_SECRET")}` }
            : {}),
        },
        body: JSON.stringify({ type: "quote", payload: request }),
      });
      if (!res.ok) {
        throw new Error(`Store webhook returned ${res.status}`);
      }
    },
  };
}

/**
 * Development-only store: prints the record. NEVER counts as configured
 * persistence in production — a console line is not a record, and
 * treating it as one would let production report a success that saved
 * nothing.
 */
const logStore: QuoteStore = {
  name: "log",
  async save(request) {
    console.info(
      "[quote-store:log] DEVELOPMENT ONLY — not persisted anywhere:",
      request.reference,
      `${request.products.length} line(s)`,
      request.orderType,
    );
  },
};

export function resolveStore(): QuoteStore | null {
  const webhook = env("QUOTE_WEBHOOK_URL");
  if (webhook) return webhookStore(webhook);
  if (process.env.NODE_ENV !== "production" && env("QUOTE_STORE") === "log") return logStore;
  return null;
}

/* ------------------------------------------------------------------ */
/* Notifiers                                                           */
/* ------------------------------------------------------------------ */

function notifyWebhook(url: string): QuoteNotifier {
  return {
    name: "notify-webhook",
    async notify(request) {
      const res = await withTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quote.created", payload: request }),
      });
      if (!res.ok) throw new Error(`Notify webhook returned ${res.status}`);
    },
  };
}

/**
 * Email through a generic HTTP mail API. Configured for Resend's shape
 * by default; any provider with a JSON `POST /emails` endpoint works by
 * changing QUOTE_EMAIL_ENDPOINT.
 */
function emailNotifier(): QuoteNotifier | null {
  const apiKey = env("QUOTE_EMAIL_API_KEY");
  const to = env("QUOTE_EMAIL_TO");
  const from = env("QUOTE_EMAIL_FROM");
  if (!apiKey || !to || !from) return null;
  const endpoint = env("QUOTE_EMAIL_ENDPOINT") || "https://api.resend.com/emails";

  return {
    name: "email",
    async notify(request) {
      const { internalEmail } = await import("@/lib/server/quote-email");
      const mail = internalEmail(request);
      const res = await withTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: to.split(",").map((a) => a.trim()).filter(Boolean),
          subject: mail.subject,
          text: mail.text,
          ...(request.buyer.email ? { reply_to: request.buyer.email } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Email API returned ${res.status}`);
    },
  };
}

/** Optional acknowledgement to the buyer. Off unless explicitly enabled. */
function buyerConfirmationNotifier(): QuoteNotifier | null {
  if (env("QUOTE_EMAIL_CONFIRM_BUYER") !== "true") return null;
  const apiKey = env("QUOTE_EMAIL_API_KEY");
  const from = env("QUOTE_EMAIL_FROM");
  if (!apiKey || !from) return null;
  const endpoint = env("QUOTE_EMAIL_ENDPOINT") || "https://api.resend.com/emails";

  return {
    name: "buyer-confirmation",
    async notify(request) {
      if (!request.buyer.email) return; // nothing to confirm to
      const { buyerEmail } = await import("@/lib/server/quote-email");
      const mail = buyerEmail(request);
      const res = await withTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [request.buyer.email],
          subject: mail.subject,
          text: mail.text,
        }),
      });
      if (!res.ok) throw new Error(`Buyer confirmation returned ${res.status}`);
    },
  };
}

export function resolveNotifiers(): QuoteNotifier[] {
  const list: QuoteNotifier[] = [];
  const email = emailNotifier();
  if (email) list.push(email);
  const webhook = env("QUOTE_NOTIFY_WEBHOOK_URL");
  if (webhook) list.push(notifyWebhook(webhook));
  const confirm = buyerConfirmationNotifier();
  if (confirm) list.push(confirm);
  return list;
}

/* ------------------------------------------------------------------ */
/* Delivery                                                            */
/* ------------------------------------------------------------------ */

export interface DeliveryOutcome {
  /** False means the caller must NOT report success to the buyer. */
  delivered: boolean;
  /** "not_configured" when there is nowhere for an RFQ to go. */
  reason?: "not_configured" | "store_failed" | "notify_failed";
  store?: string;
  notified: string[];
  notifyFailures: string[];
}

/** True when this deployment can actually receive an RFQ. */
export function isQuoteDeliveryConfigured(): boolean {
  return Boolean(resolveStore()) || resolveNotifiers().length > 0;
}

/**
 * Persist, then notify.
 *
 *   1. Store configured → it decides success. Notifications are then
 *      attempted and their failures are logged, never fatal.
 *   2. No store, notifiers only → the notifier IS the delivery, so at
 *      least one must succeed.
 *   3. Neither → not configured. The route returns 503 and the UI tells
 *      the buyer plainly that nothing was sent.
 */
export async function deliverQuote(request: QuoteRequest): Promise<DeliveryOutcome> {
  const store = resolveStore();
  const notifiers = resolveNotifiers();

  if (!store && notifiers.length === 0) {
    return { delivered: false, reason: "not_configured", notified: [], notifyFailures: [] };
  }

  if (store) {
    try {
      await store.save(request);
    } catch (error) {
      reportError(error, {
        scope: "api/quote",
        category: "storage",
        reference: request.reference,
        store: store.name,
      });
      return {
        delivered: false,
        reason: "store_failed",
        store: store.name,
        notified: [],
        notifyFailures: [],
      };
    }
  }

  const notified: string[] = [];
  const notifyFailures: string[] = [];
  for (const notifier of notifiers) {
    try {
      await notifier.notify(request);
      notified.push(notifier.name);
    } catch (error) {
      notifyFailures.push(notifier.name);
      reportError(error, {
        scope: "api/quote",
        category: "notify",
        reference: request.reference,
        notifier: notifier.name,
      });
    }
  }

  // Notifier-only deployment: nothing else is holding this request.
  if (!store && notified.length === 0) {
    return { delivered: false, reason: "notify_failed", notified, notifyFailures };
  }

  return { delivered: true, store: store?.name, notified, notifyFailures };
}

/* ------------------------------------------------------------------ */
/* Adapter sketches — copy, adapt, and return from resolveStore()      */
/* ------------------------------------------------------------------ */

/*
// Supabase (server-side key, never NEXT_PUBLIC_)
import { createClient } from "@supabase/supabase-js";
const supabaseStore: QuoteStore = {
  name: "supabase",
  async save(request) {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await supabase.from("quote_requests").insert({
      reference: request.reference,
      status: "new",
      created_at: request.createdAt,
      order_type: request.orderType,
      buyer: request.buyer,
      payload: request,        // JSONB — see docs/QUOTE-API.md
    });
    if (error) throw new Error(error.message);
  },
};

// Postgres (node-postgres)
const postgresStore: QuoteStore = {
  name: "postgres",
  async save(request) {
    await pool.query(
      `INSERT INTO quote_requests (reference, status, created_at, order_type, payload)
       VALUES ($1, 'new', $2, $3, $4)
       ON CONFLICT (reference) DO NOTHING`,
      [request.reference, request.createdAt, request.orderType, request],
    );
  },
};
*/
