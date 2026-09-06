import type {
  ContactRequest,
  QuoteRequest,
  SubmissionResult,
} from "@/types/quote";
import { siteConfig } from "@/data/site-config";

/**
 * SUBMISSION SERVICE
 * --------------------------------------------------------------------
 * The UI never talks to a backend directly — it calls `quoteService`.
 *
 * THREE MODES (see `resolveMode`):
 *
 *   "api"          Submissions are POSTed as JSON, by default to this
 *                  app's own /api/quote route. That route decides
 *                  whether delivery is actually possible — see
 *                  app/api/quote/route.ts and docs/QUOTE-API.md.
 *
 *   "mock"         DEVELOPMENT ONLY. Writes the payload to localStorage
 *                  and logs it, then resolves successfully so the whole
 *                  RFQ flow can be exercised without a backend.
 *
 *   "unconfigured" Nothing can deliver the request. Either a production
 *                  build with mock forced, or the API answered 503
 *                  `not_configured`. Submission FAILS deliberately and
 *                  the UI shows the visitor another way to reach sales.
 *
 * ── THE RULE ────────────────────────────────────────────────────────
 * A production build must never tell a customer their enquiry reached
 * SILVORA when nothing was sent. "mock" is therefore downgraded to
 * "unconfigured" whenever NODE_ENV === "production". Do not remove that
 * downgrade to "make the demo look better" — connect an endpoint instead.
 * ────────────────────────────────────────────────────────────────────
 */

export type ServiceMode = SubmissionResult["mode"];

export interface SubmitOptions {
  /** Sent as `Idempotency-Key`; a retry of the same attempt reuses it. */
  idempotencyKey?: string;
}

export interface FormsProvider {
  readonly mode: ServiceMode;
  submitQuote(payload: QuoteRequest, options?: SubmitOptions): Promise<SubmissionResult>;
  submitContact(payload: ContactRequest, options?: SubmitOptions): Promise<SubmissionResult>;
}

/* ------------------------------------------------------------------ */
/* Mode resolution                                                     */
/* ------------------------------------------------------------------ */

/** Where submissions are POSTed. The app's own route unless overridden. */
export const INTERNAL_ENDPOINT = "/api/quote";

export function quoteEndpoint(): string {
  return siteConfig.features.quoteEndpoint || INTERNAL_ENDPOINT;
}

export function resolveMode(): ServiceMode {
  if (!siteConfig.features.quoteEnabled) return "unconfigured";

  // Development may force mock to exercise the flow offline.
  if (siteConfig.features.quoteServiceMode === "mock") {
    return process.env.NODE_ENV === "production" ? "unconfigured" : "mock";
  }
  return "api";
}

/**
 * True when the client will attempt a real POST. It does NOT promise the
 * server can deliver — only the route knows that, and it answers 503
 * `not_configured` when it cannot. That answer is surfaced to the buyer
 * as "not connected", never as success.
 */
export function isSubmissionConnected(): boolean {
  return resolveMode() === "api";
}

/** Milliseconds before a submission is abandoned as unreachable. */
export const SUBMIT_TIMEOUT_MS = 20_000;

/** Random key so a retry of the same attempt is not stored twice. */
export function createIdempotencyKey(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return random.replace(/-/g, "").slice(0, 32);
}

/* ------------------------------------------------------------------ */
/* Reference                                                           */
/* ------------------------------------------------------------------ */

/**
 * Locally generated request reference, e.g. `SLV-260906-4KX2`. It exists
 * so a buyer and the sales team can talk about the same request. It is
 * NOT an order number and carries no authority — a backend is free to
 * issue its own and return it in the response.
 */
export function createReference(prefix = "SLV"): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${y}${m}${d}-${rand}`;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Mock provider — development only                                    */
/* ------------------------------------------------------------------ */

const MOCK_KEY = "silvora.submissions.v1";

const mockProvider: FormsProvider = {
  mode: "mock",
  async submitQuote(payload) {
    await wait(800);
    persistMock({ type: "quote", payload });
    return { ok: true, reference: payload.reference, mode: "mock" };
  },
  async submitContact(payload) {
    await wait(600);
    const reference = createReference("SLV-C");
    persistMock({ type: "contact", reference, payload });
    return { ok: true, reference, mode: "mock" };
  },
};

function persistMock(entry: unknown) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(window.localStorage.getItem(MOCK_KEY) ?? "[]");
    existing.push({ ...(entry as object), storedAt: new Date().toISOString() });
    window.localStorage.setItem(MOCK_KEY, JSON.stringify(existing));
    console.info(
      "[quote-service] MOCK MODE — nothing was sent. Payload stored in localStorage under",
      MOCK_KEY,
      entry,
    );
  } catch {
    /* storage unavailable — ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Unconfigured provider — production with no endpoint                 */
/* ------------------------------------------------------------------ */

const unconfiguredProvider: FormsProvider = {
  mode: "unconfigured",
  async submitQuote() {
    return { ok: false, mode: "unconfigured" };
  },
  async submitContact() {
    return { ok: false, mode: "unconfigured" };
  },
};

/* ------------------------------------------------------------------ */
/* API provider                                                        */
/* ------------------------------------------------------------------ */

interface ApiErrorBody {
  error?: string;
  code?: string;
  fields?: { field: string; message: string }[];
}

function createApiProvider(endpoint: string): FormsProvider {
  async function post(
    type: "quote" | "contact",
    payload: unknown,
    options: { idempotencyKey?: string } = {},
  ): Promise<SubmissionResult> {
    // A request must never hang forever on a bad rural connection: the
    // buyer needs to get back to a retryable state with their data
    // intact, not watch a spinner.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
        },
        body: JSON.stringify({ type, payload }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
        // The server saying "I cannot deliver this" is not a transient
        // error — it is the unconfigured state, and the buyer is told so.
        if (res.status === 503 && body.code === "not_configured") {
          return { ok: false, error: body.error, mode: "unconfigured" };
        }
        return {
          ok: false,
          error: body.error ?? `Request failed (${res.status})`,
          mode: "api",
        };
      }

      const data = (await res.json().catch(() => ({}))) as { reference?: string };
      // The server's reference is authoritative; the local one was only
      // ever a draft label.
      return { ok: true, reference: data.reference, mode: "api" };
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      return {
        ok: false,
        error: aborted
          ? "The request timed out. Your details are saved — please try again."
          : err instanceof Error
            ? err.message
            : "Network error",
        mode: "api",
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    mode: "api",
    submitQuote: (p, options) => post("quote", p, options),
    submitContact: (p) => post("contact", p),
  };
}

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */

export function createQuoteService(): FormsProvider {
  switch (resolveMode()) {
    case "api":
      return createApiProvider(quoteEndpoint());
    case "mock":
      return mockProvider;
    default:
      return unconfiguredProvider;
  }
}

export const quoteService: FormsProvider = createQuoteService();

/* ------------------------------------------------------------------ */
/* Sketches for other backends (not wired — copy and adapt)            */
/* ------------------------------------------------------------------ */

/*
// Supabase
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const supabaseProvider: FormsProvider = {
  mode: "api",
  async submitQuote(payload) {
    const { error } = await supabase.from("quote_requests").insert(payload);
    return error
      ? { ok: false, error: error.message, mode: "api" }
      : { ok: true, reference: payload.reference, mode: "api" };
  },
  async submitContact(payload) {
    const reference = createReference("SLV-C");
    const { error } = await supabase.from("contact_messages").insert({ reference, ...payload });
    return error ? { ok: false, error: error.message, mode: "api" } : { ok: true, reference, mode: "api" };
  },
};
*/
