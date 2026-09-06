/**
 * CANONICAL ORIGIN
 * --------------------------------------------------------------------
 * `NEXT_PUBLIC_SITE_URL` is the single public origin for this site. It
 * drives canonical tags, the sitemap, robots, Open Graph, Twitter cards,
 * structured data and every share URL.
 *
 * Getting it wrong is expensive and quiet: a production deploy that
 * canonicalises to example.com or localhost tells search engines the
 * real site does not exist. So this module normalises the value, refuses
 * obviously-wrong ones in production, and says so loudly at build time.
 *
 * Nothing here throws — a hard failure during `next build` would be a
 * worse outcome than a loud warning plus a safe fallback.
 */

const FALLBACK = "https://www.example.com";

/** Hosts that must never appear as the canonical origin of a live site. */
const INVALID_PRODUCTION_HOSTS = [
  "example.com",
  "www.example.com",
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
];

export interface SiteUrlCheck {
  /** Normalised origin, never with a trailing slash. */
  origin: string;
  /** The raw configured value, for diagnostics. */
  raw: string | undefined;
  ok: boolean;
  /** Human-readable reason when `ok` is false. */
  problem?: string;
}

/**
 * Normalise a configured origin: trim, add a scheme if missing, drop any
 * path, query, hash and trailing slash. Returns null when unparseable.
 */
export function normalizeOrigin(input: string | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname || !url.hostname.includes(".")) {
      // Allow bare localhost, reject other dotless hosts as typos.
      if (url.hostname !== "localhost") return null;
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/** Inspect the configured site URL without side effects. */
export function checkSiteUrl(raw = process.env.NEXT_PUBLIC_SITE_URL): SiteUrlCheck {
  const isProduction = process.env.NODE_ENV === "production";
  const normalized = normalizeOrigin(raw);

  if (!normalized) {
    return {
      origin: FALLBACK,
      raw,
      ok: false,
      problem: raw
        ? `NEXT_PUBLIC_SITE_URL is not a valid URL: ${JSON.stringify(raw)}`
        : "NEXT_PUBLIC_SITE_URL is not set",
    };
  }

  const host = new URL(normalized).hostname.toLowerCase();

  if (INVALID_PRODUCTION_HOSTS.includes(host)) {
    return {
      origin: normalized,
      raw,
      // Only a problem for a real deployment; fine while developing.
      ok: !isProduction,
      problem: isProduction
        ? `NEXT_PUBLIC_SITE_URL points at ${host} — canonical URLs, the sitemap and Open Graph will all be wrong`
        : undefined,
    };
  }

  if (isProduction && normalized.startsWith("http://")) {
    return {
      origin: normalized,
      raw,
      ok: false,
      problem: "NEXT_PUBLIC_SITE_URL uses http:// — a production origin should be https://",
    };
  }

  return { origin: normalized, raw, ok: true };
}

// Evaluated once per process. In a production build this runs during
// `next build`, so a misconfiguration is visible in the build log.
const check = checkSiteUrl();

/*
 * Warn once, not once per request. Dev re-evaluates modules on every
 * compile, so a plain module-level flag still repeats on every page
 * load — the flag lives on globalThis instead. A misconfigured origin
 * needs to be seen, not to bury the rest of the log.
 */
const WARNED = Symbol.for("cornfodder.site-url.warned");
type WarnedGlobal = typeof globalThis & { [WARNED]?: boolean };

if (!check.ok && check.problem && !(globalThis as WarnedGlobal)[WARNED]) {
  (globalThis as WarnedGlobal)[WARNED] = true;
  const message = `[site-url] ${check.problem}. Falling back to ${check.origin}.`;
  if (process.env.NODE_ENV === "production") {
    console.error(message);
  } else if (process.env.NODE_ENV !== "test") {
    console.warn(message);
  }
}

/** The canonical origin. Never has a trailing slash. */
export const siteOrigin: string = check.origin;

/** True when the configured origin is safe to publish. */
export const siteUrlIsValid: boolean = check.ok;

/**
 * Absolute URL for a path. Idempotent on trailing slashes: `/`, `` and
 * `products/` all normalise predictably.
 */
export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  // Keep the root as "/", strip trailing slashes everywhere else.
  const normalizedPath = clean === "/" ? "/" : clean.replace(/\/+$/, "");
  return `${siteOrigin}${normalizedPath}`;
}
