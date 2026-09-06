/**
 * URL SAFETY
 * --------------------------------------------------------------------
 * Document URLs are configuration, and configuration is written by
 * hand. This module is what stands between a typo in `data/products.ts`
 * and a broken — or dangerous — button on a live product page.
 *
 * Accepted:
 *   /docs/premium-round-spec.pdf        (site-relative, preferred)
 *   https://cdn.example.com/spec.pdf    (absolute https)
 *   http://…                            (absolute http — allowed, flagged by the audit)
 *
 * Rejected:
 *   ""            an unset field
 *   "#"           a placeholder that looks like a link
 *   "javascript:" script execution dressed as a document
 *   "data:"       inline payloads
 *   "docs/x.pdf"  ambiguous relative path
 *   anything unparseable
 */

const BLOCKED_SCHEMES = ["javascript:", "data:", "vbscript:", "file:", "blob:"];

export function isSafeDocumentUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const value = url.trim();
  if (!value || value === "#") return false;

  const lower = value.toLowerCase();
  if (BLOCKED_SCHEMES.some((scheme) => lower.startsWith(scheme))) return false;

  // Site-relative path — the normal case for files in /public.
  if (value.startsWith("/")) return !value.startsWith("//");

  // Absolute URL — must parse and must be http(s).
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Why a URL was rejected. Used by `npm run validate:data`. */
export function documentUrlProblem(url: string | undefined | null): string | null {
  if (!url) return null; // absent is fine — the button simply does not render
  const value = url.trim();
  if (!value) return "empty string — remove the field instead";
  if (value === "#") return '"#" is a placeholder, not a document';
  const lower = value.toLowerCase();
  const blocked = BLOCKED_SCHEMES.find((scheme) => lower.startsWith(scheme));
  if (blocked) return `blocked scheme ${blocked}`;
  if (value.startsWith("//")) return "protocol-relative URL — use https://";
  if (value.startsWith("/")) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return `unsupported scheme ${parsed.protocol}`;
    }
    return null;
  } catch {
    return "not a valid URL, and not a site-relative path starting with /";
  }
}

/** `rel` for an outbound document link. */
export const externalLinkRel = "noopener noreferrer";
