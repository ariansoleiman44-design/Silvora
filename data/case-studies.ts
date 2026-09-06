import type { CaseStudy } from "@/types/case-study";

/**
 * CASE STUDIES — intentionally empty.
 *
 * While this array is empty, /results returns 404 and is absent from the
 * navigation and the sitemap. Add a real, customer-approved case study
 * and everything appears automatically.
 */
export const caseStudies: CaseStudy[] = [];

export const publishedCaseStudies = (): CaseStudy[] => caseStudies.filter((c) => c.approved);

export const getCaseStudy = (slug: string): CaseStudy | undefined =>
  publishedCaseStudies().find((c) => c.slug === slug);
