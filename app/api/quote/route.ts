import { NextResponse } from "next/server";
import { validateContactRequest, validateQuoteRequest, LIMITS } from "@/lib/server/validate-quote";
import { createServerReference } from "@/lib/server/reference";
import {
  deliverContact,
  deliverQuote,
  isContactDeliveryConfigured,
  isQuoteDeliveryConfigured,
} from "@/lib/server/quote-sinks";
import {
  checkBotSignals,
  checkRateLimit,
  clientKey,
  recallIdempotent,
  rememberIdempotent,
} from "@/lib/server/guards";
import { reportError } from "@/lib/observability";

/**
 * RFQ ENDPOINT
 * --------------------------------------------------------------------
 * POST /api/quote — the only path by which an enquiry reaches the
 * business. Contract and examples: docs/QUOTE-API.md
 *
 * ── THE LOAD-BEARING RULE ───────────────────────────────────────────
 * This route reports success ONLY after a configured destination has
 * actually accepted the request. If no store and no notifier is
 * configured it answers 503 `not_configured`, and the UI tells the
 * visitor plainly that nothing was sent and offers another channel.
 *
 * Do not add a fallback that "logs and returns 200" to make a demo or a
 * staging deploy look finished. Telling a farmer their order arrived
 * when it did not is the worst failure this system can have.
 * ────────────────────────────────────────────────────────────────────
 *
 * Order of work, and why:
 *   1. size cap      — cheap, before parsing anything
 *   2. rate limit    — cheap, before validation
 *   3. parse + bots  — quiet signals, no CAPTCHA
 *   4. validate      — the browser is never trusted
 *   5. idempotency   — a double-tap returns the first reference
 *   6. deliver       — persist, then notify
 *
 * Logs carry a reference, a category and an outcome. They never carry
 * the buyer's name, contact details or notes.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ErrorBody {
  error: string;
  code: string;
  fields?: { field: string; message: string }[];
}

const fail = (status: number, body: ErrorBody, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers });

export async function POST(request: Request) {
  const started = Date.now();

  /* 1 — body size ---------------------------------------------------- */
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > LIMITS.maxBodyBytes) {
    return fail(413, { error: "That request is too large.", code: "payload_too_large" });
  }

  /* 2 — rate limit --------------------------------------------------- */
  const key = clientKey(request.headers);
  const rate = checkRateLimit(key);
  if (!rate.allowed) {
    console.warn(`[api/quote] rate-limited client, retry in ${rate.retryAfter}s`);
    return fail(
      429,
      {
        error: "Too many requests from this connection. Please try again shortly.",
        code: "rate_limited",
      },
      { "Retry-After": String(rate.retryAfter) },
    );
  }

  /* 3 — parse + bot signals ------------------------------------------ */
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > LIMITS.maxBodyBytes) {
      return fail(413, { error: "That request is too large.", code: "payload_too_large" });
    }
    body = JSON.parse(raw);
  } catch {
    return fail(400, { error: "Malformed request body.", code: "invalid_json" });
  }

  const envelope = (body ?? {}) as Record<string, unknown>;
  // Accept both { type, payload } and a bare payload.
  const payload = (envelope.payload ?? envelope) as Record<string, unknown>;
  /*
   * The envelope's `type` decides which validator runs. Ignoring it —
   * as this route used to — meant every contact enquiry was validated
   * as a quote, failed on the missing orderType/products/delivery, and
   * came back 422. The contact form could not submit at all.
   */
  const kind = envelope.type === "contact" ? "contact" : "quote";

  const bot = checkBotSignals({
    honeypot: payload.website,
    formStartedAt: payload.formStartedAt,
  });
  if (bot.bot) {
    // Answer like a success so automation gains no signal, but nothing
    // is stored, sent, or given a real reference.
    console.warn(`[api/quote] rejected bot signal: ${bot.signal}`);
    return NextResponse.json({ reference: createServerReference("CF") }, { status: 200 });
  }

  /*
   * 4 — idempotency key, read before the branch so BOTH forms get it.
   *
   * The in-process cache below is a fast path only. It is per-instance
   * and keyed by client IP, so it cannot be relied on: two buyers behind
   * one office connection share a key space, and the browser aborts at
   * 20s while this handler can still be notifying at 32s — the retry
   * routinely arrives before the key is recorded. The real guarantee is
   * a unique column in the database (docs/sql/002-idempotency.sql),
   * enforced inside the store.
   */
  const idempotencyKey =
    request.headers.get("idempotency-key")?.trim() ||
    (typeof payload.idempotencyKey === "string" ? payload.idempotencyKey.trim() : "");

  if (idempotencyKey) {
    const previous = recallIdempotent(`${key}:${idempotencyKey}`);
    if (previous) {
      console.info(`[api/quote] duplicate submission ignored, reference ${previous}`);
      return NextResponse.json({ reference: previous, duplicate: true }, { status: 200 });
    }
  }

  /* 4b — contact enquiries take their own path ----------------------- */
  if (kind === "contact") {
    return handleContact(payload, key, started, idempotencyKey);
  }

  /* 5 — validate ----------------------------------------------------- */
  const result = validateQuoteRequest(payload);
  if (!result.ok) {
    return fail(422, {
      error: "Some details need checking before we can send this.",
      code: "validation_failed",
      fields: result.errors,
    });
  }

  /* 6 — deliver ------------------------------------------------------ */
  if (!isQuoteDeliveryConfigured()) {
    console.error(
      "[api/quote] not configured — no QUOTE_WEBHOOK_URL and no notifier. Nothing was sent.",
    );
    return fail(503, {
      error:
        "Online submission is not connected yet. Your request has not been sent — please use the contact details on the site.",
      code: "not_configured",
    });
  }

  const reference = createServerReference("CF");
  const record = { ...result.value, reference };

  try {
    const outcome = await deliverQuote(record, idempotencyKey || undefined);

    if (!outcome.delivered) {
      console.error(`[api/quote] ${reference} not delivered: ${outcome.reason}`);
      return fail(
        outcome.reason === "not_configured" ? 503 : 502,
        outcome.reason === "not_configured"
          ? {
              error:
                "Online submission is not connected yet. Your request has not been sent — please use the contact details on the site.",
              code: "not_configured",
            }
          : {
              error: "We could not send your request. Please try again in a moment.",
              code: "delivery_failed",
            },
      );
    }

    /*
     * The store is the authority on the reference. If it had to re-mint
     * because of a collision, the buyer must be given the one that was
     * actually written — quoting anything else would pull up somebody
     * else's request.
     */
    const storedReference = outcome.reference ?? reference;

    if (idempotencyKey) rememberIdempotent(`${key}:${idempotencyKey}`, storedReference);

    console.info(
      `[api/quote] ${storedReference} delivered via ${outcome.store ?? "notifier"}` +
        `${outcome.notified.length ? `, notified: ${outcome.notified.join(",")}` : ""}` +
        `${outcome.notifyFailures.length ? `, notify failures: ${outcome.notifyFailures.join(",")}` : ""}` +
        ` (${Date.now() - started}ms)`,
    );

    return NextResponse.json({ reference: storedReference }, { status: 200 });
  } catch (error) {
    // Never leak a stack trace to the browser.
    reportError(error, { scope: "api/quote", category: "unhandled", reference });
    return fail(500, {
      error: "We could not send your request. Please try again in a moment.",
      code: "server_error",
    });
  }
}

/** Health/status for the launch audit. Reveals no configuration values. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: isQuoteDeliveryConfigured(),
  });
}

/* ------------------------------------------------------------------ */
/* Contact enquiries                                                   */
/* ------------------------------------------------------------------ */

/**
 * The same contract as a quote submission, with a different validator
 * and a different destination: nothing is reported as received unless
 * something durable accepted it.
 *
 * `key` is the caller identity already computed for rate limiting, so
 * an enquiry counts against the same budget as a quote — one form
 * cannot be used to get around the limit on the other.
 */
async function handleContact(
  payload: Record<string, unknown>,
  key: string,
  started: number,
  idempotencyKey: string,
): Promise<NextResponse> {
  const result = validateContactRequest(payload);
  if (!result.ok) {
    return fail(422, {
      error: "Some details need checking before we can send this.",
      code: "validation_failed",
      fields: result.errors,
    });
  }

  if (!isContactDeliveryConfigured()) {
    console.error("[api/contact] not configured — nothing was sent.");
    return fail(503, {
      error:
        "Online submission is not connected yet. Your message has not been sent — please use the contact details on the site.",
      code: "not_configured",
    });
  }

  // "CFC" marks an enquiry apart from a quote at a glance. Three
  // letters, not "CF-C": REFERENCE_PATTERN is ^[A-Z]{2,4}-\d{6}-[A-Z2-9]{4}$
  // and a second hyphen would not match it.
  const reference = createServerReference("CFC");

  try {
    const outcome = await deliverContact(result.value, reference, idempotencyKey || undefined);

    if (!outcome.delivered) {
      console.error(`[api/contact] ${reference} not delivered: ${outcome.reason}`);
      return fail(
        outcome.reason === "not_configured" ? 503 : 502,
        outcome.reason === "not_configured"
          ? {
              error:
                "Online submission is not connected yet. Your message has not been sent — please use the contact details on the site.",
              code: "not_configured",
            }
          : {
              error: "We could not send your message. Please try again in a moment.",
              code: "delivery_failed",
            },
      );
    }

    const storedReference = outcome.reference ?? reference;
    if (idempotencyKey) rememberIdempotent(`${key}:${idempotencyKey}`, storedReference);
    console.info(
      `[api/contact] ${storedReference} delivered via ${outcome.store ?? "notifier"}` +
        `${outcome.notified.length ? `, notified: ${outcome.notified.join(",")}` : ""}` +
        ` (${Date.now() - started}ms)`,
    );
    return NextResponse.json({ reference: storedReference }, { status: 200 });
  } catch (error) {
    reportError(error, { scope: "api/contact", category: "unhandled", reference });
    return fail(500, {
      error: "Something went wrong at our end. Please try again.",
      code: "server_error",
    });
  }
}
