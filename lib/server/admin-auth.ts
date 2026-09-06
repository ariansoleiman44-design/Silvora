import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * ADMIN AUTHENTICATION
 * --------------------------------------------------------------------
 * One shared password, hashed with scrypt, exchanged for an HMAC-signed
 * session cookie. Node's own crypto does all of it, so the panel adds
 * no dependency.
 *
 * WHAT THIS IS SIZED FOR: a handful of trusted staff at one company.
 * The audit log therefore records "admin", not a person. If more people
 * need access, or if you need to know who changed what, move to
 * per-person accounts — this module is deliberately small enough to
 * replace.
 *
 * WHY SCRYPT AND NOT A PLAIN COMPARISON: the hash sits in an
 * environment variable that appears in deployment dashboards, CI logs
 * and screenshots. Storing the password itself there would mean anyone
 * who ever glimpses the config has the password. scrypt is also
 * deliberately slow, which blunts offline guessing if the hash leaks.
 *
 * THE SESSION COOKIE is stateless: a signed expiry, nothing else. There
 * is no session table to read on every request, and no way to revoke a
 * single session — rotating ADMIN_SESSION_SECRET logs everyone out at
 * once, which is the right blunt instrument for a panel this size.
 */

export const ADMIN_COOKIE = "silvora_admin";

/** Eight hours: a working day, then log in again. */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const SCRYPT_KEY_LENGTH = 64;

const env = (key: string): string => (process.env[key] ?? "").trim();

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

export interface AuthConfigProblem {
  configured: false;
  reason: string;
}

/**
 * The panel refuses to run rather than fall back to a default password.
 * A default password on an admin panel is not a convenience, it is an
 * open door — the same rule the quote system already follows when it
 * refuses to fake a submission.
 */
export function adminAuthStatus(): { configured: true } | AuthConfigProblem {
  const hash = env("ADMIN_PASSWORD_HASH");
  const secret = env("ADMIN_SESSION_SECRET");

  if (!hash) return { configured: false, reason: "ADMIN_PASSWORD_HASH is not set" };
  if (!/^scrypt:[0-9a-f]{32,}:[0-9a-f]{64,}$/.test(hash)) {
    return {
      configured: false,
      reason: "ADMIN_PASSWORD_HASH is malformed — regenerate it with `npm run admin:password`",
    };
  }
  if (!secret) return { configured: false, reason: "ADMIN_SESSION_SECRET is not set" };
  if (secret.length < 32) {
    return {
      configured: false,
      reason: "ADMIN_SESSION_SECRET is shorter than 32 characters",
    };
  }
  return { configured: true };
}

export function isAdminConfigured(): boolean {
  return adminAuthStatus().configured;
}

/* ------------------------------------------------------------------ */
/* Password                                                            */
/* ------------------------------------------------------------------ */

/** Produce the value for ADMIN_PASSWORD_HASH. Used by the CLI script. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

/**
 * Constant-time password check. Returns false for any malformed input
 * rather than throwing, so a bad env var cannot crash the login route.
 */
export function verifyPassword(password: string): boolean {
  const stored = env("ADMIN_PASSWORD_HASH");
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  try {
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Session token                                                       */
/* ------------------------------------------------------------------ */

const b64url = (input: Buffer | string): string =>
  Buffer.from(input).toString("base64url");

function sign(payload: string): string {
  return createHmac("sha256", env("ADMIN_SESSION_SECRET")).update(payload).digest("base64url");
}

/** Mint a session token valid for SESSION_TTL_MS. */
export function createSessionToken(now = Date.now()): string {
  const payload = b64url(JSON.stringify({ iat: now, exp: now + SESSION_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

/**
 * Verify a token's signature and expiry.
 *
 * The signature is compared with timingSafeEqual, and the payload is
 * only parsed AFTER the signature checks out — an attacker must never
 * get JSON.parse to run on bytes they control and we have not
 * authenticated.
 */
export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  if (!isAdminConfigured()) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  if (!timingSafeEqual(expected, actual)) return false;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp?: number };
    return typeof claims.exp === "number" && claims.exp > now;
  } catch {
    return false;
  }
}

/** Cookie attributes for the session. */
export function sessionCookieOptions(secure = process.env.NODE_ENV === "production") {
  return {
    httpOnly: true,
    // Strict, not Lax: nothing should ever navigate into the admin panel
    // from another site carrying the session.
    sameSite: "strict" as const,
    secure,
    path: "/admin",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

/* ------------------------------------------------------------------ */
/* Login throttling                                                    */
/* ------------------------------------------------------------------ */

/**
 * Separate from the RFQ rate limiter in guards.ts and much stricter.
 * That one is tuned to never block a real buyer; this one guards a
 * password, where a slow lockout is the point.
 *
 * In-process, like the RFQ limiter: on several instances each holds its
 * own counters. It raises the cost of guessing rather than eliminating
 * it, which is why the password must still be strong.
 */
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginAttempt(key: string, now = Date.now()): { allowed: boolean; retryAfter: number } {
  if (attempts.size > 1_000) {
    for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
  }

  const bucket = attempts.get(key);
  if (!bucket || bucket.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;
  return {
    allowed: bucket.count <= LOGIN_MAX_ATTEMPTS,
    retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Called after a successful login so a correct password clears the count. */
export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}
