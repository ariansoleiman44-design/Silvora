import type { MediaKey } from "@/data/media";

/**
 * CASE STUDIES
 * --------------------------------------------------------------------
 * Structure for published customer results. No entry may be written
 * from imagination: every case study needs a real operation, real
 * consent and an outcome the customer will stand behind.
 *
 * The /results route returns 404 while `caseStudies` is empty, and the
 * route is not in the navigation until there is something to show.
 */

export interface CaseStudy {
  slug: string;
  /** e.g. "Barzan Dairy". Use "Anonymous dairy" if the farm prefers. */
  operation: string;
  location: string;
  /** e.g. "240-cow dairy herd". */
  herdSize: string;
  /** Slugs from data/products.ts. */
  productsUsed: string[];
  challenge: string;
  solution: string;
  /** What actually changed. Measured, attributable, not a claim. */
  outcome: string;
  /** Optional metrics, e.g. { label: "Bales per month", value: "120" }. */
  metrics?: { label: string; value: string }[];
  image?: MediaKey;
  /** The customer has approved publication of this text. */
  approved: boolean;
  publishedAt?: string;
}
