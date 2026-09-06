import type { Certification, ClientLogo, Partner, Testimonial } from "@/types/trust";

/**
 * TRUST DATA — intentionally empty.
 *
 * Components that read these arrays render NOTHING while they are empty,
 * so the site never shows a hollow "Our partners" band. Add entries only
 * when they are real; see PRE-LAUNCH.md.
 */

export const certifications: Certification[] = [];

export const labPartners: Partner[] = [];

export const farmPartners: Partner[] = [];

export const clientLogos: ClientLogo[] = [];

/** Only testimonials with `approved: true` are ever rendered. */
export const testimonials: Testimonial[] = [];

export const approvedTestimonials = (): Testimonial[] => testimonials.filter((t) => t.approved);

/** True when there is at least one real trust signal to show. */
export const hasTrustSignals = (): boolean =>
  certifications.length > 0 ||
  labPartners.length > 0 ||
  farmPartners.length > 0 ||
  clientLogos.length > 0 ||
  approvedTestimonials().length > 0;
