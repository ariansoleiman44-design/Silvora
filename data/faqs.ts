/** Procurement-oriented grouping. Order here is the display order. */
export type FaqCategory =
  | "buying"
  | "commercial"
  | "delivery"
  | "storage"
  | "product-data"
  | "terms";

export const faqCategoryLabels: Record<FaqCategory, string> = {
  buying: "Farm buying",
  commercial: "Commercial supply",
  delivery: "Delivery",
  storage: "Storage",
  "product-data": "Product data",
  terms: "Payment & terms",
};

export interface Faq {
  question: string;
  answer: string;
  /** Defaults to "buying" when omitted. */
  category?: FaqCategory;
}

/**
 * FAQ content. Used on the homepage (with FAQ structured data) and
 * available for reuse on other pages.
 */
export const faqs: Faq[] = [
  {
    category: "commercial",
    question: "Can I set up recurring supply instead of ordering each time?",
    answer:
      "Yes. Choose \"recurring supply\" when you build a request and tell us the cadence — weekly, fortnightly, monthly or your own schedule. We plan the loads around your storage and feed-out rate rather than a fixed calendar.",
  },
  {
    category: "commercial",
    question: "Do you quote full truck quantities?",
    answer:
      "Full loads are the normal unit for commercial supply. Tell us the quantity and destination in your request and we plan the loads around the equipment available at both ends.",
  },
  {
    category: "commercial",
    question: "Do you work with distributors and resellers?",
    answer:
      "Distributor enquiries are welcome. Select \"distributor / reseller\" when you build a request and tell us your territory, expected volume and any packaging or labelling requirement, and we will discuss terms.",
  },
  {
    category: "product-data",
    question: "Can SILVORA provide a batch analysis?",
    answer:
      "Laboratory analysis is issued per batch rather than as a fixed product figure, because a batch is what a laboratory can actually measure. Tick \"I need laboratory / batch specifications\" in your request and we will send what is available for the batch you would receive.",
  },
  {
    category: "product-data",
    question: "Can I request a specific bale format?",
    answer:
      "Yes. Every format we produce is listed under Products with its own specification. If none of them fits your handling equipment, describe what you need — format is one of the things we can adjust for a planned supply agreement.",
  },
  {
    category: "delivery",
    question: "Can I include delivery requirements with my request?",
    answer:
      "Use the delivery planner on the Logistics page, or the delivery step when you build a request. Access constraints — track width, gate height, turning space, timing — are far cheaper to solve before a truck is loaded than at your gate.",
  },
  {
    category: "delivery",
    question: "How is availability confirmed?",
    answer:
      "Availability shown on a product page is a supply state, not a stock count. What can actually be delivered depends on the harvest, the season and the destination, so it is confirmed in writing when we quote.",
  },
  {
    category: "terms",
    question: "How are prices determined?",
    answer:
      "By quantity, destination, season and logistics. There is no list price because the same bale costs a different amount to put on a farm ten kilometres away and on a truck to a port. Send a request and you get a figure for your situation.",
  },
  {
    category: "buying",
    question: "What is corn silage?",
    answer:
      "Corn silage is the whole maize plant — stalk, leaves and cob — harvested green, chopped finely, compacted to remove air and sealed so it ferments. The fermentation preserves the crop as a high-energy forage that can be stored and fed for many months.",
  },
  {
    category: "buying",
    question: "What bale formats are available?",
    answer:
      "We offer round bales in standard and large sizes, square and high-density square bales for stacking and transport, a compact bale for smaller operations, and custom formats for bulk agreements. Each product page lists the format details.",
  },
  {
    category: "storage",
    question: "How should wrapped silage be stored?",
    answer:
      "On a clean, firm, well-drained surface away from sharp objects, vermin and direct mechanical damage. Keep the wrap intact, inspect regularly and repair any puncture immediately with silage tape. Storage guidance is included with every product.",
  },
  {
    category: "commercial",
    question: "Can I order commercial quantities?",
    answer:
      "Yes. Commercial, full-load and seasonal volume agreements are our core business. Use the quote request to tell us your livestock, quantity and timing, and we will plan the supply with you.",
  },
  {
    category: "delivery",
    question: "Can you arrange delivery?",
    answer:
      "We support farm pickup, regional delivery and full truck loads, and we can prepare export movements. Delivery coverage and costs are confirmed for each order based on your location and access.",
  },
  {
    category: "product-data",
    question: "How do I request product specifications?",
    answer:
      "Every product page shows the current specification sheet. For measured data on a specific batch — dry matter, protein, starch, fibre, pH — request it through the quote form or contact sales and we will send the batch analysis.",
  },
  {
    category: "product-data",
    question: "Can I request a sample or inspection?",
    answer:
      "Yes. Ask for a sample bale or arrange an inspection before you commit to volume. Inspecting smell, appearance, wrap integrity and compaction is exactly what we recommend.",
  },
  {
    category: "terms",
    question: "How are prices calculated?",
    answer:
      "Pricing depends on bale format, quantity, harvest season, delivery distance and any custom requirements. Because these vary, we quote each order individually rather than publishing a list price.",
  },
];

/** FAQs grouped for display, in category order. Empty groups are dropped. */
export function faqsByCategory(
  items: Faq[] = faqs,
  labels: Record<FaqCategory, string> = faqCategoryLabels,
): { category: FaqCategory; label: string; items: Faq[] }[] {
  return (Object.keys(labels) as FaqCategory[])
    .map((category) => ({
      category,
      label: labels[category],
      items: items.filter((f) => (f.category ?? "buying") === category),
    }))
    .filter((group) => group.items.length > 0);
}
