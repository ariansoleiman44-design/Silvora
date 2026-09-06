import type { Product, BaleFormat, Application, OrderType } from "@/types/product";

/**
 * PRODUCT CATALOGUE
 * --------------------------------------------------------------------
 * All product content lives here. Every figure (weight, dimensions,
 * moisture, dry matter, minimum order …) is a DEMO placeholder marked
 * `demo: true`. Replace them with measured product data and remove the
 * flag — the UI stops showing the "demo" marker automatically.
 *
 * To add a product: copy an entry, give it a unique `id` and `slug`,
 * pick images from data/media.ts and it appears in the grid, filters,
 * related products, sitemap and Bale Finder automatically.
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

const demoNutrition = (values: Partial<Record<string, number>> = {}) => [
  { key: "dryMatter", label: "Dry matter", unit: "%", value: values.dryMatter, demo: true },
  { key: "crudeProtein", label: "Crude protein", unit: "% DM", value: values.crudeProtein, demo: true },
  { key: "starch", label: "Starch", unit: "% DM", value: values.starch, demo: true },
  { key: "ndf", label: "NDF", unit: "% DM", value: values.ndf, demo: true },
  { key: "adf", label: "ADF", unit: "% DM", value: values.adf, demo: true },
  { key: "ph", label: "pH", unit: "", value: values.ph, demo: true },
];

const commonStorage = [
  "Store on a clean, firm, well-drained surface away from sharp objects and vermin.",
  "Keep the wrap intact. Inspect regularly and tape any puncture immediately.",
  "Once opened, feed out within a period suited to your climate to limit aerobic spoilage.",
];

const commonHandling = [
  "Use a bale handler or soft-grip attachment — never spikes through the wrap.",
  "Lift from the flat faces; avoid dragging bales across rough ground.",
  "Stack according to the format guidance below and keep stacks stable.",
];

export const products: Product[] = [
  {
    id: "p-001",
    slug: "premium-round-bale",
    name: "Premium Round Bale",
    shortName: "Premium Round",
    category: "Round Bales",
    format: "round",
    application: ["dairy", "beef", "general"],
    orderType: ["small-farm", "commercial"],
    tagline: "Our signature format. Dense, sealed and consistent from the first bale to the last.",
    shortDescription:
      "The everyday premium bale: individually wrapped round corn silage built for reliable daily feeding.",
    description: [
      "The Premium Round Bale is the heart of the collection. Chopped maize is compacted into a dense round core and sealed in multiple layers of stretch film so the crop can ferment undisturbed.",
      "It suits farms that value a manageable unit size, straightforward handling and the confidence that every bale opens the way the last one did.",
    ],
    images: ["balesField", "baleClose", "baleGolden"],
    featured: true,
    badge: "Signature",
    approxWeightKg: 750,
    weight: { label: "Approx. weight", value: "≈ 700 – 800 kg", note: "Varies with moisture and density.", demo: true },
    dimensions: { label: "Dimensions", value: "≈ 120 × 120 cm", demo: true },
    wrapping: { label: "Wrapping", value: "Multi-layer stretch film, sealed", demo: true },
    chop: { label: "Chop length", value: "Short, uniform chop", demo: true },
    moisture: { label: "Moisture", value: "Target range — confirmed per batch", demo: true },
    storage: { label: "Storage", value: "Outdoor storage on a clean, firm base", demo: true },
    minimumOrder: { label: "Minimum order", value: "Configurable — enquire", demo: true },
    availability: "available",
    delivery: { label: "Delivery", value: "Farm pickup or regional delivery", demo: true },
    harvestOrigin: { label: "Harvest origin", value: "Set your growing region in data/products.ts", demo: true },
    nutrition: demoNutrition(),
    features: [
      "Uniform chop for steady intake",
      "Dense round core that sheds water",
      "Sealed multi-layer wrap",
      "Consistent unit size for daily rationing",
    ],
    bestFor: [
      "Dairy and beef herds feeding a bale a day",
      "Farms with a standard bale handler",
      "Buyers who want the flagship format",
    ],
    storageGuidance: commonStorage,
    handling: [...commonHandling, "Stack round bales on their flat ends, no more than two high on firm ground."],
    deliveryNotes: [
      "Loaded flat-end down for transport stability.",
      "Full-load and part-load options depending on distance.",
    ],
    faq: [
      {
        question: "How many bales fit on a standard truck?",
        answer: "It depends on the trailer and local axle limits. Tell us your route and we will plan the load with you.",
      },
    ],
    related: ["dairy-performance-bale", "large-round-bale", "beef-feeding-bale"],
  },
  {
    id: "p-002",
    slug: "large-round-bale",
    name: "Large Round Bale",
    shortName: "Large Round",
    category: "Round Bales",
    format: "round",
    application: ["beef", "dairy", "general"],
    orderType: ["commercial", "bulk"],
    tagline: "More feed per lift. Built for herds that go through forage quickly.",
    shortDescription:
      "A larger round format that reduces handling per tonne fed while keeping the sealed-bale advantage.",
    description: [
      "The Large Round Bale carries more material per unit, which means fewer lifts, fewer wraps to open and less labour per tonne.",
      "It is intended for operations with heavier handling equipment and a feeding rate that empties a bale before it can deteriorate.",
    ],
    images: ["baleGolden", "balesSunset", "balesRow"],
    approxWeightKg: 950,
    weight: { label: "Approx. weight", value: "≈ 900 – 1,000 kg", demo: true },
    dimensions: { label: "Dimensions", value: "≈ 130 × 130 cm", demo: true },
    wrapping: { label: "Wrapping", value: "Multi-layer stretch film, sealed", demo: true },
    chop: { label: "Chop length", value: "Short, uniform chop", demo: true },
    moisture: { label: "Moisture", value: "Target range — confirmed per batch", demo: true },
    storage: { label: "Storage", value: "Outdoor storage on a clean, firm base", demo: true },
    minimumOrder: { label: "Minimum order", value: "Configurable — enquire", demo: true },
    availability: "available",
    delivery: { label: "Delivery", value: "Full truck loads preferred", demo: true },
    harvestOrigin: { label: "Harvest origin", value: "Set your growing region in data/products.ts", demo: true },
    nutrition: demoNutrition(),
    features: [
      "Fewer lifts per tonne fed",
      "Same sealed-bale protection as the Premium Round",
      "Ideal for high-throughput feeding",
    ],
    bestFor: [
      "Larger beef and dairy units",
      "Farms with telehandlers or heavy loaders",
      "Buyers ordering full loads",
    ],
    storageGuidance: commonStorage,
    handling: [...commonHandling, "Requires a handler rated for the heavier unit weight."],
    deliveryNotes: ["Fewer units per load — planned around your unloading equipment."],
    related: ["premium-round-bale", "beef-feeding-bale", "bulk-custom-order"],
  },
  {
    id: "p-003",
    slug: "square-silage-bale",
    name: "Square Silage Bale",
    shortName: "Square",
    category: "Square Bales",
    format: "square",
    application: ["general", "dairy", "beef"],
    orderType: ["small-farm", "commercial"],
    tagline: "Stacks tight, travels well, opens clean.",
    shortDescription:
      "A rectangular wrapped bale that stacks efficiently for storage and transport.",
    description: [
      "Square bales make the best use of a trailer bed and a storage yard. Their flat faces stack securely and their shape is easier to handle in tight barn spaces.",
      "Choose this format when storage footprint and transport efficiency matter as much as feed quality.",
    ],
    images: ["balesStack", "squareStack", "squareSingle"],
    approxWeightKg: 650,
    weight: { label: "Approx. weight", value: "≈ 600 – 700 kg", demo: true },
    dimensions: { label: "Dimensions", value: "≈ 120 × 90 × 80 cm", demo: true },
    wrapping: { label: "Wrapping", value: "Multi-layer stretch film, sealed", demo: true },
    chop: { label: "Chop length", value: "Short, uniform chop", demo: true },
    moisture: { label: "Moisture", value: "Target range — confirmed per batch", demo: true },
    storage: { label: "Storage", value: "Stackable, indoor or outdoor", demo: true },
    minimumOrder: { label: "Minimum order", value: "Configurable — enquire", demo: true },
    availability: "available",
    delivery: { label: "Delivery", value: "Efficient loads — more bales per truck", demo: true },
    harvestOrigin: { label: "Harvest origin", value: "Set your growing region in data/products.ts", demo: true },
    nutrition: demoNutrition(),
    features: [
      "Stackable flat faces",
      "High trailer utilisation",
      "Easy to portion in the feed passage",
    ],
    bestFor: ["Farms with limited storage space", "Buyers optimising transport cost", "Mixed livestock feeding"],
    storageGuidance: [...commonStorage, "Stack in a brick pattern to lock the layers together."],
    handling: commonHandling,
    deliveryNotes: ["Stacks securely for longer journeys."],
    related: ["high-density-square-bale", "export-ready-wrapped-bale", "compact-mini-bale"],
  },
  {
    id: "p-004",
    slug: "high-density-square-bale",
    name: "High-Density Square Bale",
    shortName: "High-Density",
    category: "Square Bales",
    format: "square",
    application: ["dairy", "beef"],
    orderType: ["commercial", "bulk", "export"],
    tagline: "Maximum material in minimum volume.",
    shortDescription:
      "A tightly compacted square bale engineered for long-distance transport and long storage periods.",
    description: [
      "Higher compaction means less air in the bale, more feed per cubic metre and a stronger case for long-distance and export movements.",
      "This is the format we recommend when the bale has to travel far, sit long and arrive exactly as it left.",
    ],
    images: ["squareStack", "balesStack", "balesBlack"],
    badge: "Transport-optimised",
    approxWeightKg: 850,
    weight: { label: "Approx. weight", value: "≈ 800 – 900 kg", demo: true },
    dimensions: { label: "Dimensions", value: "≈ 120 × 90 × 90 cm", demo: true },
    wrapping: { label: "Wrapping", value: "Reinforced multi-layer wrap", demo: true },
    chop: { label: "Chop length", value: "Short, uniform chop", demo: true },
    moisture: { label: "Moisture", value: "Target range — confirmed per batch", demo: true },
    storage: { label: "Storage", value: "Stackable for extended storage", demo: true },
    minimumOrder: { label: "Minimum order", value: "Full loads — enquire", demo: true },
    availability: "preorder",
    delivery: { label: "Delivery", value: "Full truck loads · export preparation available", demo: true },
    harvestOrigin: { label: "Harvest origin", value: "Set your growing region in data/products.ts", demo: true },
    nutrition: demoNutrition(),
    features: [
      "Highest density in the range",
      "Best feed-per-truck ratio",
      "Suited to extended storage",
      "Reinforced wrap for handling cycles",
    ],
    bestFor: ["Export buyers", "Large commercial units", "Long storage horizons"],
    storageGuidance: [...commonStorage, "Suitable for higher stacks on level, load-bearing ground."],
    handling: [...commonHandling, "Higher unit weight — confirm handler rating before unloading."],
    deliveryNotes: ["Planned as full truck loads.", "Export documentation prepared on request."],
    related: ["export-ready-wrapped-bale", "square-silage-bale", "bulk-custom-order"],
  },
  {
    id: "p-005",
    slug: "compact-mini-bale",
    name: "Compact Bale",
    shortName: "Compact",
    category: "Compact Bales",
    format: "compact",
    application: ["sheep-goats", "general"],
    orderType: ["small-farm"],
    tagline: "Premium silage in a size one person can manage.",
    shortDescription:
      "A smaller wrapped bale for flocks, small herds and farms without heavy handling equipment.",
    description: [
      "Not every operation runs a loader. The Compact Bale brings the same chopped, compacted and sealed corn silage to smaller farms in a unit that is practical to move and quick to feed out.",
      "Smaller bales are opened and finished faster, which helps keep feed fresh in warm conditions.",
    ],
    images: ["balesSmall", "baleTexture", "balesScattered"],
    approxWeightKg: 300,
    weight: { label: "Approx. weight", value: "≈ 250 – 350 kg", demo: true },
    dimensions: { label: "Dimensions", value: "≈ 90 × 90 cm", demo: true },
    wrapping: { label: "Wrapping", value: "Multi-layer stretch film, sealed", demo: true },
    chop: { label: "Chop length", value: "Short, uniform chop", demo: true },
    moisture: { label: "Moisture", value: "Target range — confirmed per batch", demo: true },
    storage: { label: "Storage", value: "Outdoor or covered storage", demo: true },
    minimumOrder: { label: "Minimum order", value: "Configurable — enquire", demo: true },
    availability: "seasonal",
    delivery: { label: "Delivery", value: "Farm pickup or small-load delivery", demo: true },
    harvestOrigin: { label: "Harvest origin", value: "Set your growing region in data/products.ts", demo: true },
    nutrition: demoNutrition(),
    features: [
      "Manageable without heavy machinery",
      "Fast feed-out reduces waste",
      "Same premium chop and wrap",
    ],
    bestFor: ["Sheep and goat flocks", "Smallholdings", "Supplementary feeding"],
    storageGuidance: commonStorage,
    handling: ["Can be moved with a compact loader or, with care, by two people using straps.", ...commonHandling],
    deliveryNotes: ["Small loads and mixed loads available."],
    related: ["square-silage-bale", "premium-round-bale"],
  },
  {
    id: "p-006",
    slug: "dairy-performance-bale",
    name: "Dairy Performance Bale",
    shortName: "Dairy",
    category: "Application Bales",
    format: "round",
    application: ["dairy"],
    orderType: ["commercial"],
    tagline: "Selected for the milking herd.",
    shortDescription:
      "Round corn silage selected from crops and harvest windows targeted at dairy rations.",
    description: [
      "Dairy rations reward consistency. The Dairy Performance Bale is drawn from fields and harvest timings we select with the milking herd in mind, then chopped, compacted and sealed like every Silvora bale.",
      "Per-batch analysis is available so your nutritionist can build the ration on real numbers rather than assumptions.",
    ],
    images: ["dairyBarn", "balesField", "holsteinGolden"],
    badge: "Dairy",
    approxWeightKg: 750,
    weight: { label: "Approx. weight", value: "≈ 700 – 800 kg", demo: true },
    dimensions: { label: "Dimensions", value: "≈ 120 × 120 cm", demo: true },
    wrapping: { label: "Wrapping", value: "Multi-layer stretch film, sealed", demo: true },
    chop: { label: "Chop length", value: "Short, uniform chop", demo: true },
    moisture: { label: "Moisture", value: "Target range — confirmed per batch", demo: true },
    storage: { label: "Storage", value: "Outdoor storage on a clean, firm base", demo: true },
    minimumOrder: { label: "Minimum order", value: "Configurable — enquire", demo: true },
    availability: "available",
    delivery: { label: "Delivery", value: "Scheduled regional delivery", demo: true },
    harvestOrigin: { label: "Harvest origin", value: "Set your growing region in data/products.ts", demo: true },
    nutrition: demoNutrition(),
    features: ["Crop and timing selected for dairy rations", "Batch analysis on request", "Consistent unit size for TMR planning"],
    bestFor: ["Milking herds", "Nutritionist-led rations", "Scheduled repeat deliveries"],
    storageGuidance: commonStorage,
    handling: commonHandling,
    deliveryNotes: ["Ideal for recurring scheduled deliveries."],
    related: ["premium-round-bale", "high-density-square-bale"],
  },
  {
    id: "p-007",
    slug: "beef-feeding-bale",
    name: "Beef Feeding Bale",
    shortName: "Beef",
    category: "Application Bales",
    format: "round",
    application: ["beef"],
    orderType: ["commercial", "bulk"],
    tagline: "Energy-dense forage for growing and finishing cattle.",
    shortDescription:
      "Round corn silage positioned for beef systems that need dependable energy through the season.",
    description: [
      "Beef systems run on throughput. This bale is intended for growers and finishers who need a dependable energy source that stores well and feeds out without fuss.",
      "Order it in full loads and keep a reserve so the ration never changes mid-season.",
    ],
    images: ["cattleFeeding", "balesBlack", "cattleHeads"],
    badge: "Beef",
    approxWeightKg: 800,
    weight: { label: "Approx. weight", value: "≈ 750 – 850 kg", demo: true },
    dimensions: { label: "Dimensions", value: "≈ 120 × 125 cm", demo: true },
    wrapping: { label: "Wrapping", value: "Multi-layer stretch film, sealed", demo: true },
    chop: { label: "Chop length", value: "Short, uniform chop", demo: true },
    moisture: { label: "Moisture", value: "Target range — confirmed per batch", demo: true },
    storage: { label: "Storage", value: "Outdoor storage on a clean, firm base", demo: true },
    minimumOrder: { label: "Minimum order", value: "Configurable — enquire", demo: true },
    availability: "available",
    delivery: { label: "Delivery", value: "Full loads and repeat scheduling", demo: true },
    harvestOrigin: { label: "Harvest origin", value: "Set your growing region in data/products.ts", demo: true },
    nutrition: demoNutrition(),
    features: ["Positioned for growing and finishing", "Full-load pricing", "Reserve planning available"],
    bestFor: ["Beef growers and finishers", "Feedlots and yards", "Seasonal bulk buyers"],
    storageGuidance: commonStorage,
    handling: commonHandling,
    deliveryNotes: ["Full truck loads with reserve scheduling."],
    related: ["large-round-bale", "premium-round-bale", "bulk-custom-order"],
  },
  {
    id: "p-008",
    slug: "export-ready-wrapped-bale",
    name: "Export-Ready Wrapped Bale",
    shortName: "Export",
    category: "Export",
    format: "square",
    application: ["general", "dairy", "beef"],
    orderType: ["export", "bulk"],
    tagline: "Prepared to cross borders and arrive intact.",
    shortDescription:
      "High-density square bales with reinforced wrapping and documentation prepared for export movements.",
    description: [
      "Export changes the brief: more handling cycles, longer transit, stricter paperwork. The Export-Ready Bale is our high-density square format with reinforced wrap and load planning built around containers and long-haul trailers.",
      "We prepare the specification sheet and, where required, batch analysis to accompany the shipment.",
    ],
    images: ["balesGreenWrap", "balesHills", "balesTurbines"],
    badge: "Export",
    approxWeightKg: 850,
    weight: { label: "Approx. weight", value: "≈ 800 – 900 kg", demo: true },
    dimensions: { label: "Dimensions", value: "≈ 120 × 90 × 90 cm", demo: true },
    wrapping: { label: "Wrapping", value: "Reinforced wrap for multiple handling cycles", demo: true },
    chop: { label: "Chop length", value: "Short, uniform chop", demo: true },
    moisture: { label: "Moisture", value: "Target range — confirmed per batch", demo: true },
    storage: { label: "Storage", value: "Extended storage, stackable", demo: true },
    minimumOrder: { label: "Minimum order", value: "Container / full load — enquire", demo: true },
    availability: "preorder",
    delivery: { label: "Delivery", value: "Export preparation & load planning", demo: true },
    harvestOrigin: { label: "Harvest origin", value: "Set your growing region in data/products.ts", demo: true },
    nutrition: demoNutrition(),
    features: ["Reinforced wrapping", "Container-optimised dimensions", "Specification sheet per shipment"],
    bestFor: ["Importers and traders", "Cross-border livestock operations", "Long-transit orders"],
    storageGuidance: [...commonStorage, "Inspect wrap on arrival and record any damage before unloading."],
    handling: [...commonHandling, "Plan handling for multiple loading cycles."],
    deliveryNotes: ["Export documentation prepared per shipment.", "Load plans provided for containers and trailers."],
    related: ["high-density-square-bale", "bulk-custom-order"],
  },
  {
    id: "p-009",
    slug: "bulk-custom-order",
    name: "Bulk / Custom Order",
    shortName: "Bulk & Custom",
    category: "Custom",
    format: "custom",
    application: ["general", "dairy", "beef", "sheep-goats"],
    orderType: ["bulk", "commercial", "export"],
    tagline: "Your format, your quantity, your schedule.",
    shortDescription:
      "Custom bale specifications, seasonal volume agreements and non-standard formats — planned with you.",
    description: [
      "Some operations need something the standard range does not cover: a specific bale size, a season-long supply agreement, a mixed load, or a format matched to existing equipment.",
      "Tell us what you feed, how you handle it and when you need it. We build the order around that.",
    ],
    images: ["silageTube", "balesClouds", "aerialField"],
    badge: "Made to order",
    approxWeightKg: 0,
    wrapping: { label: "Wrapping", value: "Specified per order", demo: true },
    chop: { label: "Chop length", value: "Specified per order", demo: true },
    storage: { label: "Storage", value: "Advised per format", demo: true },
    minimumOrder: { label: "Minimum order", value: "Agreed per contract", demo: true },
    availability: "contact",
    delivery: { label: "Delivery", value: "Planned per agreement", demo: true },
    harvestOrigin: { label: "Harvest origin", value: "Set your growing region in data/products.ts", demo: true },
    nutrition: demoNutrition(),
    features: ["Custom bale dimensions", "Seasonal volume agreements", "Mixed-format loads", "Scheduled repeat deliveries"],
    bestFor: ["Large commercial buyers", "Cooperatives and traders", "Operations with specific equipment"],
    storageGuidance: ["Storage guidance provided with the agreed format."],
    handling: ["Handling guidance provided with the agreed format."],
    deliveryNotes: ["Delivery schedule agreed as part of the order."],
    related: ["high-density-square-bale", "large-round-bale", "export-ready-wrapped-bale"],
  },
];

/* --------------------------------------------------------------- Helpers */

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getFeaturedProduct(): Product {
  return products.find((p) => p.featured) ?? products[0]!;
}

export function getRelatedProducts(product: Product, limit = 3): Product[] {
  const explicit = (product.related ?? [])
    .map((slug) => getProduct(slug))
    .filter((p): p is Product => Boolean(p));
  if (explicit.length >= limit) return explicit.slice(0, limit);
  const fallback = products.filter(
    (p) => p.slug !== product.slug && !explicit.includes(p) && p.format === product.format,
  );
  return [...explicit, ...fallback].slice(0, limit);
}

/**
 * Availability states. Wording is deliberately about *supply*, not
 * stock: we never claim a number of bales sitting in a yard.
 */
export const availabilityLabels: Record<Product["availability"], string> = {
  available: "Current harvest available",
  limited: "Limited supply",
  preorder: "Made to order",
  seasonal: "Seasonal — enquire for next cut",
  contact: "Contact for current supply",
  unavailable: "Not currently available",
};

/** Dot colour for the availability indicator. */
export const availabilityTone: Record<Product["availability"], "leaf" | "gold" | "muted"> = {
  available: "leaf",
  limited: "gold",
  preorder: "gold",
  seasonal: "gold",
  contact: "muted",
  unavailable: "muted",
};
