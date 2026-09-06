/**
 * RFQ TYPES
 * --------------------------------------------------------------------
 * `QuoteRequest` is the contract a backend must accept. It is documented
 * with an example payload in docs/QUOTE-API.md — keep the two in sync.
 */

/** Which procurement track the buyer is on. Drives the fields shown. */
export type OrderKind = "farm" | "commercial" | "distributor" | "export";

/** One-off purchase or a standing supply arrangement. */
export type SupplyMode = "one-time" | "recurring";

export type SupplyFrequency = "weekly" | "biweekly" | "monthly" | "custom";

export interface QuoteItem {
  /** Stable line id. Duplicating a product yields a second line. */
  uid: string;
  productId: string;
  slug: string;
  name: string;
  format: string;
  /** Estimated number of bales for this line. */
  quantity: number;
  image: string;
  /** Optional per-line supply cadence, overriding the request default. */
  frequency?: SupplyFrequency;
  /** Free-text note attached to this line. */
  notes?: string;
}

/**
 * Requirement answers. Every field is optional: which ones are asked
 * depends on `orderType` (see components/quote/StepRequirements.tsx).
 * A flat shape keeps the payload trivially serialisable and means a
 * backend never has to branch on order type to read a value.
 */
export interface QuoteRequirements {
  /* shared */
  estimatedQuantity?: string;
  /** Buyer asked for laboratory / batch specifications. */
  labDataRequested?: boolean;

  /* farm */
  livestock?: string;
  animalCount?: string;
  deliveryRequired?: "yes" | "no" | "";

  /* commercial */
  monthlyVolume?: string;
  preferredFormat?: string;
  contractLength?: string;

  /* distributor */
  resaleTerritory?: string;
  packagingRequirements?: string;
  privateLabelInterest?: "yes" | "no" | "";

  /* export */
  destinationCountry?: string;
  destinationPort?: string;
  loadPreference?: string;
  incoterm?: string;
}

export interface QuoteDelivery {
  country: string;
  region: string;
  /** ISO date (yyyy-mm-dd) or "" — a preference, never a commitment. */
  preferredDate: string;
  /** Does the site have equipment to unload a truck? */
  unloadEquipment: "yes" | "no" | "";
  notes: string;
}

export interface QuoteBuyer {
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
}

/** Output of the requirement calculator, carried into the request. */
export interface CalculatorEstimate {
  mode: "quick" | "herd";
  animalType?: string;
  animals: number;
  perAnimalPerDay: number;
  days: number;
  usablePerBale: number;
  wastePercent: number;
  reservePercent: number;
  totalKg: number;
  bales: number;
  reserveBales: number;
  balesWithReserve: number;
  weeklyKg: number;
  monthlyKg: number;
}

/** The full payload a backend receives. */
export interface QuoteRequest {
  /** Client-generated, e.g. "SLV-260906-4KX2". Not authoritative. */
  reference: string;
  createdAt: string;
  orderType: OrderKind;
  buyer: QuoteBuyer;
  /** Convenience duplicate of buyer.company. */
  company: string;
  products: QuoteItem[];
  requirements: QuoteRequirements;
  delivery: QuoteDelivery;
  supplyMode: SupplyMode;
  frequency: SupplyFrequency | null;
  /** Free text when `frequency === "custom"`. */
  frequencyNote: string;
  calculatorEstimate: CalculatorEstimate | null;
  notes: string;
  marketingConsent: boolean;
  /** Where the request originated, e.g. "quote-wizard". */
  source: string;
}

export interface ContactRequest {
  name: string;
  company: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  message: string;
  submittedAt: string;
}

/**
 * `mode` is how the submission was handled:
 *   "api"          — actually sent to the configured endpoint.
 *   "mock"         — development simulation. Nothing left the browser.
 *   "unconfigured" — production build with no endpoint. The UI must tell
 *                    the visitor to use another contact method; it must
 *                    never imply the enquiry was delivered.
 */
export interface SubmissionResult {
  ok: boolean;
  reference?: string;
  error?: string;
  mode: "api" | "mock" | "unconfigured";
}
