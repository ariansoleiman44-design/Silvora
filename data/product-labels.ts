import type { Product, BaleFormat, Application, OrderType } from "@/types/product";

/**
 * PRODUCT LABELS
 * --------------------------------------------------------------------
 * The English display name for each machine value on a product. These
 * live apart from data/products.ts on purpose: they are the only part
 * of the product model a client component ever needs, and importing
 * them from the catalogue module dragged all nine products — 76 KB,
 * demo nutrition figures included — into the browser bundle.
 *
 * Translated labels come from `useDict().labels`, not from here. Use
 * this module only where the English value is the intended one, such
 * as text written into a quote line that the sales team reads.
 *
 * data/products.ts re-exports all four maps, so existing server-side
 * imports keep working.
 */

export const formatLabels: Record<BaleFormat, string> = {
  round: "Round",
  square: "Square",
  compact: "Compact",
  custom: "Custom",
};

export const applicationLabels: Record<Application, string> = {
  dairy: "Dairy",
  beef: "Beef",
  "sheep-goats": "Sheep & Goats",
  general: "General livestock",
};

export const orderTypeLabels: Record<OrderType, string> = {
  "small-farm": "Small farm",
  commercial: "Commercial",
  bulk: "Bulk",
  export: "Export",
};

export const availabilityLabels: Record<Product["availability"], string> = {
  available: "Current harvest available",
  limited: "Limited supply",
  preorder: "Made to order",
  seasonal: "Seasonal — enquire for next cut",
  contact: "Contact for current supply",
  unavailable: "Not currently available",
};

/** Badge colour for each availability state. Presentation, not data. */
export const availabilityTone: Record<Product["availability"], "leaf" | "gold" | "muted"> = {
  available: "leaf",
  limited: "gold",
  preorder: "gold",
  seasonal: "gold",
  contact: "muted",
  unavailable: "muted",
};
