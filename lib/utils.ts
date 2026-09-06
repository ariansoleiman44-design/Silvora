/** Tiny className joiner — avoids a dependency for something this small. */
export function cn(
  ...classes: Array<string | false | null | undefined | 0>
): string {
  return classes.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, locale = "en"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    value,
  );
}

export function formatTonnes(kg: number, locale = "en"): string {
  const t = kg / 1000;
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: t < 10 ? 1 : 0,
  }).format(t)} t`;
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
