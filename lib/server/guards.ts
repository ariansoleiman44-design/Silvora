/**
 * ABUSE GUARDS
 * --------------------------------------------------------------------
 * Deliberately gentle. The people this endpoint exists for are farmers
 * and buyers on rural mobile connections, sometimes sharing an office IP,
 * sometimes retrying because a page half-loaded. A guard that blocks one
 * genuine RFQ costs more than the spam it prevents.
 *
 * So: no CAPTCHA. A quiet honeypot, a submission-timing check with a
 * generous floor, a body-size cap, and a loose per-IP rate limit.
 *
 * SCOPE: state is in-process. On one server that is correct. On several
 * instances each holds its own counters, which weakens the rate limit
 * and the idempotency window but never rejects a legitimate request.
 * If you need strict guarantees, back these with Redis or enforce
 * idempotency in the database on the reference column.
 */

/* ------------------------------------------------------------------ */
/* Rate limiting                                                       */
/* ------------------------------------------------------------------ */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const RATE_WINDOW_MS = Number(process.env.QUOTE_RATE_WINDOW_MS ?? 10 * 60 * 1000);
const RATE_MAX = Number(process.env.QUOTE_RATE_MAX ?? 12);

export interface RateResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
}

export function checkRateLimit(key: string, now = Date.now()): RateResult {
  // Opportunistic cleanup — this map only ever holds active windows.
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_MAX - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
  return {
    allowed: existing.count <= RATE_MAX,
    remaining: Math.max(0, RATE_MAX - existing.count),
    retryAfter,
  };
}

/** Best-effort client identity from proxy headers. */
export function clientKey(headers: Headers): string {
  /*
   * TRUST ORDER MATTERS, AND THE LEFTMOST X-Forwarded-For ENTRY IS NOT
   * TRUSTWORTHY.
   *
   * A client can send its own X-Forwarded-For header; a proxy appends
   * to it rather than replacing it. Taking the leftmost entry — as this
   * did — therefore reads a value the caller chose, so anyone could mint
   * a fresh rate-limit and login-throttle bucket per request simply by
   * varying it. Against the admin password that turned an 8-attempt
   * lockout into no lockout at all.
   *
   * So: prefer a header only the platform can set, and when falling
   * back to X-Forwarded-For take the RIGHTMOST entry, which is the one
   * the hop nearest us wrote.
   */
  const platform =
    headers.get("cf-connecting-ip") ??
    headers.get("x-vercel-forwarded-for") ??
    headers.get("x-real-ip");
  if (platform?.trim()) return platform.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((h) => h.trim()).filter(Boolean);
    const nearest = hops[hops.length - 1];
    if (nearest) return nearest;
  }

  /*
   * Nothing identifying available. Everyone shares one bucket, which
   * throttles harder than intended rather than not at all — the safe
   * direction to fail for a password gate.
   */
  return "unknown";
}

/* ------------------------------------------------------------------ */
/* Idempotency                                                         */
/* ------------------------------------------------------------------ */

interface Recorded {
  reference: string;
  at: number;
}

const seen = new Map<string, Recorded>();
const IDEMPOTENCY_TTL_MS = 30 * 60 * 1000;

/** A previous reference for this key, if the same submission just ran. */
export function recallIdempotent(key: string, now = Date.now()): string | null {
  const hit = seen.get(key);
  if (!hit) return null;
  if (now - hit.at > IDEMPOTENCY_TTL_MS) {
    seen.delete(key);
    return null;
  }
  return hit.reference;
}

export function rememberIdempotent(key: string, reference: string, now = Date.now()): void {
  if (seen.size > 5_000) {
    for (const [k, v] of seen) if (now - v.at > IDEMPOTENCY_TTL_MS) seen.delete(k);
  }
  seen.set(key, { reference, at: now });
}

/* ------------------------------------------------------------------ */
/* Bot signals                                                         */
/* ------------------------------------------------------------------ */

/** Minimum plausible time from opening the form to submitting it. */
const MIN_FILL_MS = 3_000;

export interface BotCheck {
  bot: boolean;
  signal?: "honeypot" | "too-fast";
}

/**
 * Two quiet signals:
 *
 *   honeypot  a field hidden from people; only automation fills it.
 *   timing    a five-step wizard cannot honestly be completed in three
 *             seconds. The floor is low on purpose — a returning buyer
 *             with a restored draft is fast, and must still get through.
 *
 * A missing or unparseable `formStartedAt` is NOT treated as a bot: an
 * old cached page or a blocked clock should never cost someone an RFQ.
 */
export function checkBotSignals(input: { honeypot?: unknown; formStartedAt?: unknown }): BotCheck {
  if (typeof input.honeypot === "string" && input.honeypot.trim() !== "") {
    return { bot: true, signal: "honeypot" };
  }
  const started = Number(input.formStartedAt);
  if (Number.isFinite(started) && started > 0) {
    const elapsed = Date.now() - started;
    if (elapsed >= 0 && elapsed < MIN_FILL_MS) return { bot: true, signal: "too-fast" };
  }
  return { bot: false };
}
