/**
 * TRUST SIGNALS
 * --------------------------------------------------------------------
 * Types only — the data files ship EMPTY on purpose. Every consumer
 * renders nothing when its array is empty, so there are no placeholder
 * logos, no invented certifications and no fabricated testimonials.
 *
 * Populate data/trust.ts only with things that are real and verifiable.
 */

export interface Certification {
  /** e.g. "ISO 22000". */
  name: string;
  issuer: string;
  /** Optional PDF or verification page. */
  url?: string;
  /** ISO date the certificate expires, if applicable. */
  validUntil?: string;
}

export interface Partner {
  name: string;
  /** e.g. "Laboratory", "Farm", "Transport". */
  role: string;
  location?: string;
  url?: string;
}

export interface ClientLogo {
  name: string;
  /** Path under /public. */
  logo: string;
  url?: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  /** e.g. "Herd manager, 240-cow dairy". */
  role: string;
  location?: string;
  /** Written permission to publish must exist before this is used. */
  approved: boolean;
}
