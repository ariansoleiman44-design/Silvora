"use client";

import { availabilityTone } from "@/data/product-labels";
import { useDict } from "@/lib/locale-client";
import { siteConfig } from "@/data/site-config";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * Availability state — a supply status, never a stock count.
 *
 * A client component on purpose. Both callers (SpecDrawer and
 * ProductBuyBox) are client components, so this always rendered on the
 * client anyway — but it read its labels through the SERVER helper
 * `getDictionary()`, which pulled data/dictionaries.ts, and with it the
 * whole product catalogue plus its demo nutrition figures, across the
 * client boundary. `useDict()` reads the same localised labels from the
 * provider that is already in the tree.
 *
 * There is deliberately no "only N left": the business cannot verify a
 * number of bales in a yard, so the UI has no way to express one.
 */
export function AvailabilityBadge({
  product,
  tone = "dark",
  className,
}: {
  product: Product;
  /** Surface the badge sits on. */
  tone?: "light" | "dark";
  className?: string;
}) {
  // Hook first: this is a client component now, so the early return
  // below must not sit between the render and the hook call.
  const availabilityLabels = useDict().labels.availability;

  if (!siteConfig.features.availabilityEnabled) return null;

  const dot = availabilityTone[product.availability];
  const dotClass =
    dot === "leaf" ? "bg-leaf" : dot === "gold" ? "bg-gold" : tone === "dark" ? "bg-cream/40" : "bg-ink/30";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} />
      <span className={tone === "dark" ? "text-cream" : "text-ink"}>
        {availabilityLabels[product.availability]}
      </span>
      {product.availabilityNote && (
        <span className={tone === "dark" ? "text-cream/60" : "text-ink/60"}>
          · {product.availabilityNote}
        </span>
      )}
    </span>
  );
}
