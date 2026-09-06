import { NextResponse } from "next/server";
import { validateQuoteRequest, LIMITS } from "@/lib/server/validate-quote";
import { createServerReference } from "@/lib/server/reference";
import { deliverQuote, isQuoteDeliveryConfigured } from "@/lib/server/quote-sinks";
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

  /* 4 — validate ----------------------------------------------------- */
  const result = validateQuoteRequest(payload);
  if (!result.ok) {
    return fail(422, {
      error: "Some details need checking before we can send this.",
      code: "validation_failed",
      fields: result.errors,
    });
  }

  /* 5 — idempotency -------------------------------------------------- */
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
    const outcome = await deliverQuote(record);

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

    if (idempotencyKey) rememberIdempotent(`${key}:${idempotencyKey}`, reference);

    console.info(
      `[api/quote] ${reference} delivered via ${outcome.store ?? "notifier"}` +
        `${outcome.notified.length ? `, notified: ${outcome.notified.join(",")}` : ""}` +
        `${outcome.notifyFailures.length ? `, notify failures: ${outcome.notifyFailures.join(",")}` : ""}` +
        ` (${Date.now() - started}ms)`,
    );

    return NextResponse.json({ reference }, { status: 200 });
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
