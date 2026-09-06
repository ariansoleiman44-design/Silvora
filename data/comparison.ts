/**
 * Format comparison shown on the homepage. Values are descriptive
 * positioning statements, not measured performance claims.
 */

export interface ComparisonColumn {
  key: "round" | "square" | "high-density" | "compact";
  label: string;
  productSlug: string;
}

export const comparisonColumns: ComparisonColumn[] = [
  { key: "round", label: "Round", productSlug: "premium-round-bale" },
  { key: "square", label: "Square", productSlug: "square-silage-bale" },
  { key: "high-density", label: "High-Density", productSlug: "high-density-square-bale" },
  { key: "compact", label: "Compact", productSlug: "compact-mini-bale" },
];

export interface ComparisonRow {
  label: string;
  values: Record<ComparisonColumn["key"], string>;
}

export const comparisonRows: ComparisonRow[] = [
  {
    label: "Handling",
    values: {
      round: "Standard bale handler",
      square: "Standard handler or forks",
      "high-density": "Heavier-rated handler",
      compact: "Compact loader or manual with straps",
    },
  },
  {
    label: "Storage",
    values: {
      round: "Outdoor, flat-end down, two high",
      square: "Stackable, indoor or outdoor",
      "high-density": "Stackable for extended storage",
      compact: "Outdoor or covered, low stacks",
    },
  },
  {
    label: "Typical order type",
    values: {
      round: "Small farm to commercial",
      square: "Small farm to commercial",
      "high-density": "Commercial, bulk, export",
      compact: "Small farm",
    },
  },
  {
    label: "Transport efficiency",
    values: {
      round: "Good",
      square: "Very good",
      "high-density": "Best in range",
      compact: "Good for small loads",
    },
  },
  {
    label: "Farm size",
    values: {
      round: "Any herd feeding a bale a day",
      square: "Space-constrained yards",
      "high-density": "Large units, long transit",
      compact: "Flocks and smallholdings",
    },
  },
  {
    label: "Feeding flexibility",
    values: {
      round: "Whole-bale feeding",
      square: "Easy to portion",
      "high-density": "Whole-bale, high throughput",
      compact: "Opened and finished quickly",
    },
  },
];
