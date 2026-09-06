import type { Product } from "@/types/product";

/**
 * Deterministic "Find your bale" logic. No AI, no network — a small
 * rule table that maps answers to a product slug and a reason.
 *
 * The catalogue is passed in so the recommendation comes back in the
 * reader's language; the rules themselves are locale-independent
 * because they match on slugs, never on names.
 */

export interface FinderAnswers {
  livestock?: string;
  size?: string;
  frequency?: string;
  format?: string;
}

export interface FinderResult {
  product: Product;
  reason: string;
}

/*
 * `catalogue` is REQUIRED. Defaulting it to the English product list
 * silently returned English names inside a translated page and pulled
 * the whole catalogue into the browser bundle — BaleFinder is a client
 * component and already passes its localised list.
 */
export function recommendBale(a: FinderAnswers, catalogue: Product[]): FinderResult {
  const find = (slug: string) => catalogue.find((p) => p.slug === slug);
  const pick = (slug: string, reason: string): FinderResult => ({
    product: find(slug) ?? find("premium-round-bale") ?? catalogue[0]!,
    reason,
  });

  // Traders and importers → export format regardless of livestock.
  if (a.size === "trader") {
    return pick(
      "export-ready-wrapped-bale",
      "Export-ready high-density bales travel further and arrive intact, with documentation prepared per shipment.",
    );
  }

  // Small flocks without heavy handling equipment → compact.
  if ((a.livestock === "sheep" || a.livestock === "goats") && a.size !== "large") {
    return pick(
      "compact-mini-bale",
      "Compact bales are opened and finished quickly, which keeps feed fresh for flocks and small herds.",
    );
  }

  if (a.size === "small" && a.format === "compact") {
    return pick("compact-mini-bale", "A compact format matches a smaller operation without heavy handling equipment.");
  }

  // Explicit format preference wins next.
  if (a.format === "square") {
    if (a.size === "large" || a.frequency === "weekly") {
      return pick(
        "high-density-square-bale",
        "High-density square bales give the best feed-per-truck ratio for large or frequent orders.",
      );
    }
    return pick("square-silage-bale", "Square bales stack tightly and travel efficiently for your order size.");
  }

  if (a.format === "compact") {
    return pick("compact-mini-bale", "You asked for compact — a size one person can manage.");
  }

  // Round or unsure → application-led.
  if (a.livestock === "dairy") {
    return pick(
      "dairy-performance-bale",
      "Selected from crops and harvest windows targeted at dairy rations, with batch analysis on request.",
    );
  }

  if (a.livestock === "beef") {
    if (a.size === "large" || a.frequency === "weekly") {
      return pick(
        "large-round-bale",
        "A larger round bale means fewer lifts per tonne for a herd that goes through forage quickly.",
      );
    }
    return pick("beef-feeding-bale", "Positioned for growing and finishing cattle, ordered in full loads with a reserve.");
  }

  if (a.size === "large") {
    return pick("large-round-bale", "More feed per lift for a larger operation with heavier handling equipment.");
  }

  return pick(
    "premium-round-bale",
    "Our signature format: a manageable unit size, straightforward handling and consistent feed-out.",
  );
}
