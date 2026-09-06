/**
 * RTL SCROLL HELPERS
 * --------------------------------------------------------------------
 * Horizontal scrolling is the one place logical CSS properties do not
 * save you. In a right-to-left container the browser reports
 * `scrollLeft` as a NEGATIVE offset that decreases as the user scrolls
 * further (the modern spec, followed by current Chrome, Safari and
 * Firefox). Code written for LTR therefore reads a progress bar that
 * runs backwards and a step counter stuck on 1.
 *
 * These two helpers normalise it: `scrollProgressPx` always returns a
 * positive distance from the start edge, and `scrollDirection` converts
 * "next / previous" into the physical sign the browser expects.
 */

/** Distance scrolled from the start edge, always ≥ 0, in both directions. */
export function scrollOffset(el: HTMLElement): number {
  // Negative in RTL, positive in LTR — the magnitude is what we want.
  return Math.abs(el.scrollLeft);
}

/** Maximum scrollable distance. Direction-independent. */
export function scrollRange(el: HTMLElement): number {
  return Math.max(0, el.scrollWidth - el.clientWidth);
}

/** 0–1 progress from the start edge, correct in both directions. */
export function scrollProgress(el: HTMLElement): number {
  const range = scrollRange(el);
  return range > 0 ? Math.min(1, scrollOffset(el) / range) : 0;
}

/**
 * Convert a logical direction (1 = next, -1 = previous) into the
 * physical delta `scrollBy` expects for this element.
 */
export function scrollDelta(el: HTMLElement, direction: 1 | -1, distance: number): number {
  const rtl = getComputedStyle(el).direction === "rtl";
  return (rtl ? -direction : direction) * distance;
}
