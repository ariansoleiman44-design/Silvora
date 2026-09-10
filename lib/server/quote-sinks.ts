import type { ContactRequest, QuoteRequest } from "@/types/quote";
import { reportError } from "@/lib/observability";
import { insertRows, isSupabaseConfigured, SupabaseError } from "@/lib/server/supabase";
import { createServerReference } from "@/lib/server/reference";

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
  /**
   * Persist the request and return the reference actually stored.
   *
   * It returns a reference rather than void because a store may have to
   * change it: if the minted reference collides with one already in the
   * table, the record must be written under a new one and the BUYER must
   * be told that new one. Silently keeping the old one hands them a
   * reference belonging to somebody else's request.
   *
   * Throw to fail — the caller reports failure.
   */
  save(request: QuoteRequest): Promise<{ reference: string }>;
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
      // A webhook has no uniqueness constraint to collide with, so the
      // reference it was handed is the one that was stored.
      return { reference: request.reference };
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
    return { reference: request.reference };
  },
};

/**
 * Supabase Postgres over its REST API — no SDK, see lib/server/supabase.ts.
 *
 * The reference is the primary key, so a retry of the same submission
 * collides rather than duplicating. PostgREST reports that as 409, and
 * a 409 here means "this exact RFQ is already stored", which is the
 * outcome we wanted — so it is a success, not a failure. Any other
 * error throws and the buyer is told the submission failed.
 *
 * The flat columns are extracted for filtering in the admin inbox. The
 * full request goes into `payload` and is the record of truth.
 */
function supabaseStore(): QuoteStore {
  return {
    name: "supabase",
    async save(request) {
      /*
       * A 409 here is NOT "already saved". The reference is minted
       * server-side per submission with a random suffix, so a collision
       * means a DIFFERENT buyer's request already holds this reference.
       * Treating it as success — as this did — dropped the second
       * request entirely and handed that buyer the first one's
       * reference. They would be told they were received, nothing would
       * be stored, and quoting their reference would pull up someone
       * else's order.
       *
       * So a collision re-mints and retries. Three attempts is far
       * beyond plausible: the suffix is 4 characters from a 32-symbol
       * alphabet, scoped to one day.
       */
      let reference = request.reference;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const record = { ...request, reference };
        try {
          await insertRows("quote_requests", [
            {
              reference,
              created_at: record.createdAt,
              status: "new",
              order_type: record.orderType,
              company: record.company || record.buyer.company || "",
              buyer_name: record.buyer.name ?? "",
              buyer_email: record.buyer.email ?? "",
              buyer_phone: record.buyer.phone ?? "",
              country: record.delivery?.country ?? "",
              line_count: record.products.length,
              // The payload carries the same reference as the column, so
              // the record is self-consistent after a re-mint.
              payload: record,
            },
          ]);
          return { reference };
        } catch (error) {
          if (error instanceof SupabaseError && error.status === 409) {
            reportError(error, {
              scope: "api/quote",
              category: "reference-collision",
              reference,
            });
            reference = createServerReference("CF");
            continue;
          }
          throw error;
        }
      }

      throw new Error("Could not store the request: reference collided three times.");
    },
  };
}

export function resolveStore(): QuoteStore | null {
  // Database first: it is the only option the admin panel can read back.
  if (isSupabaseConfigured()) return supabaseStore();
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
  /**
   * The reference actually persisted. It can differ from the one that
   * was minted if the store had to re-mint on a collision, and it is
   * this value — never the original — that the buyer must be shown.
   */
  reference?: string;
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

  let storedReference = request.reference;

  if (store) {
    try {
      const saved = await store.save(request);
      storedReference = saved.reference;
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

  return { delivered: true, reference: storedReference, store: store?.name, notified, notifyFailures };
}

/* ------------------------------------------------------------------ */
/* Contact enquiries                                                   */
/* ------------------------------------------------------------------ */

/**
 * The general enquiry form goes to its own table, not to quote_requests.
 *
 * They are different objects: an enquiry has no products, no delivery
 * and no order type, and it moves through a different set of states
 * (replied / closed rather than quoted / won / lost). Forcing one into
 * the other's shape is what produced the bug where every contact
 * submission was validated as a quote and rejected.
 *
 * The same rule as everywhere else applies: if nothing durable accepts
 * it, the caller must not tell the sender it was received.
 */
export interface ContactStore {
  readonly name: string;
  save(request: ContactRequest, reference: string): Promise<void>;
}

function supabaseContactStore(): ContactStore {
  return {
    name: "supabase",
    async save(request, reference) {
      await insertRows("contact_requests", [
        {
          created_at: request.submittedAt,
          status: "new",
          name: request.name,
          company: request.company,
          email: request.email,
          phone: request.phone,
          // There is no subject field on the form; the reference gives
          // staff something stable to quote back in a reply.
          subject: `Enquiry ${reference}`,
          payload: { ...request, reference },
        },
      ]);
    },
  };
}

function webhookContactStore(url: string): ContactStore {
  return {
    name: "webhook",
    async save(request, reference) {
      const res = await withTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(env("QUOTE_WEBHOOK_SECRET")
            ? { Authorization: `Bearer ${env("QUOTE_WEBHOOK_SECRET")}` }
            : {}),
        },
        body: JSON.stringify({ type: "contact", payload: { ...request, reference } }),
      });
      if (!res.ok) throw new Error(`Contact store webhook returned ${res.status}`);
    },
  };
}

export function resolveContactStore(): ContactStore | null {
  if (isSupabaseConfigured()) return supabaseContactStore();
  const webhook = env("QUOTE_WEBHOOK_URL");
  if (webhook) return webhookContactStore(webhook);
  return null;
}

/** Email the enquiry to the sales inbox, reusing the quote mail transport. */
function contactEmailNotifier(): QuoteNotifier | null {
  const apiKey = env("QUOTE_EMAIL_API_KEY");
  const to = env("QUOTE_EMAIL_TO");
  const from = env("QUOTE_EMAIL_FROM");
  if (!apiKey || !to || !from) return null;
  const endpoint = env("QUOTE_EMAIL_ENDPOINT") || "https://api.resend.com/emails";

  return {
    name: "contact-email",
    async notify(request) {
      const c = request as unknown as ContactRequest & { reference?: string };
      const lines = [
        `Name:     ${c.name}`,
        c.company ? `Company:  ${c.company}` : "",
        c.email ? `Email:    ${c.email}` : "",
        c.phone ? `Phone:    ${c.phone}` : "",
        c.country || c.city ? `Location: ${[c.city, c.country].filter(Boolean).join(", ")}` : "",
        "",
        c.message,
      ].filter(Boolean);

      const res = await withTimeout(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          from,
          to: to.split(",").map((a) => a.trim()).filter(Boolean),
          subject: `Enquiry ${c.reference ?? ""} — ${c.name}`.trim(),
          text: lines.join("\n"),
          ...(c.email ? { reply_to: c.email } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Contact email API returned ${res.status}`);
    },
  };
}

export function isContactDeliveryConfigured(): boolean {
  return resolveContactStore() !== null || contactEmailNotifier() !== null;
}

/**
 * Same contract as deliverQuote: the STORE decides success. A notifier
 * only becomes the delivery mechanism when there is no store, because
 * then it is the only thing holding the message.
 */
export async function deliverContact(
  request: ContactRequest,
  reference: string,
): Promise<DeliveryOutcome> {
  const store = resolveContactStore();
  const notifier = contactEmailNotifier();

  if (!store && !notifier) {
    return { delivered: false, reason: "not_configured", notified: [], notifyFailures: [] };
  }

  if (store) {
    try {
      await store.save(request, reference);
    } catch (error) {
      reportError(error, { scope: "api/contact", category: "storage", reference, store: store.name });
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
  if (notifier) {
    try {
      await notifier.notify({ ...request, reference } as never);
      notified.push(notifier.name);
    } catch (error) {
      notifyFailures.push(notifier.name);
      reportError(error, { scope: "api/contact", category: "notify", reference, notifier: notifier.name });
    }
  }

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
