import { siteConfig } from "@/data/site-config";

/**
 * ANALYTICS EVENT LAYER
 * --------------------------------------------------------------------
 * A typed, provider-agnostic event bus. Nothing is wired: `track()` is a
 * no-op unless `siteConfig.features.analyticsEnabled` is true, and even
 * then it only forwards to whatever `sink` you install.
 *
 * PRIVACY (enforced, not just documented)
 * --------------------------------------------------------------------
 * RFQ data is business and personal information. `track()` passes only
 * an allowlist of keys through to the sink; anything else is dropped
 * before a provider can see it. Numeric quantities are bucketed rather
 * than sent exactly, because an exact bale count plus a timestamp is
 * effectively an identifier for a specific buyer.
 *
 * NEVER sent: name, company, phone, WhatsApp, email, addresses, free
 * text of any kind, the quote reference, or any part of the payload.
 *
 * To connect a provider later, call `setAnalyticsSink()` once from a
 * client component near the root — no component that fires an event ever
 * needs to change:
 *
 *   // Plausible
 *   setAnalyticsSink((name, props) => window.plausible?.(name, { props }));
 *
 *   // PostHog
 *   setAnalyticsSink((name, props) => posthog.capture(name, props));
 *
 *   // GA4
 *   setAnalyticsSink((name, props) => window.gtag?.("event", name, props));
 *
 * Do not import a provider SDK here — that would pull it into every
 * bundle that fires an event.
 */

export type AnalyticsEvent =
  | "hero_cta_click"
  | "product_view"
  | "product_save"
  | "product_add_to_quote"
  | "quote_started"
  | "quote_step_completed"
  | "quote_submitted"
  | "whatsapp_click"
  | "calculator_completed"
  | "delivery_planner_completed"
  | "spec_request"
  | "search_used";

export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

/**
 * The only keys that may leave the browser. Adding one is a privacy
 * decision — check it cannot identify a buyer, on its own or combined
 * with a timestamp.
 */
const ALLOWED_KEYS = new Set([
  "product",
  "productId",
  "format",
  "orderType",
  "step",
  "mode",
  "ok",
  "lines",
  "quantityBucket",
  "source",
  "calculatorMode",
]);

/** Keys whose numeric value is bucketed instead of passed through. */
const BUCKETED_KEYS = new Set(["quantity", "bales"]);

/** Coarse size band. Never an exact count. */
export function quantityBucket(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value < 10) return "1-9";
  if (value < 50) return "10-49";
  if (value < 100) return "50-99";
  if (value < 250) return "100-249";
  if (value < 500) return "250-499";
  if (value < 1000) return "500-999";
  return "1000+";
}

/**
 * Drop anything not on the allowlist, bucket the quantities. Exported
 * so the rule is testable rather than merely asserted.
 */
export function sanitizeProps(props?: AnalyticsProps): AnalyticsProps | undefined {
  if (!props) return undefined;
  const out: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    if (BUCKETED_KEYS.has(key)) {
      const n = typeof value === "number" ? value : Number(value);
      if (Number.isFinite(n)) out.quantityBucket = quantityBucket(n);
      continue;
    }
    if (!ALLOWED_KEYS.has(key)) continue;
    out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

export type AnalyticsSink = (event: AnalyticsEvent, props?: AnalyticsProps) => void;

let sink: AnalyticsSink | null = null;

/** Install a provider. Call once, client side. */
export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

/**
 * Fire an event. Safe to call from anywhere, including during SSR and
 * before consent — it does nothing until a sink is installed and the
 * feature flag is on.
 */
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (!siteConfig.features.analyticsEnabled) return;
  if (typeof window === "undefined") return;
  if (!sink) return;
  try {
    sink(event, sanitizeProps(props));
  } catch {
    /* analytics must never break the page */
  }
}
