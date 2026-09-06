import { siteConfig } from "@/data/site-config";

/**
 * CONTACT CHANNELS
 * --------------------------------------------------------------------
 * Two jobs, deliberately separated:
 *
 *   Display value — human friendly, exactly as configured.
 *   Link value    — normalised so formatting characters cannot break it.
 *
 * And one rule: a channel that is still a placeholder produces no link
 * and no button anywhere on the site. A dead `tel:` is worse than a
 * missing one, and a `wa.me/0000000000` in production is embarrassing.
 *
 * No country code is ever guessed. If a number is stored without one it
 * stays without one — inventing +964 for a buyer in Erbil and being
 * wrong is worse than a number that simply does not link.
 */

/** Digits only, keeping a leading + if present. */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return digits ? (hasPlus ? `+${digits}` : digits) : "";
}

/** Digits only, no plus — the format wa.me expects. */
export function normalizeWhatsapp(input: string): string {
  return input.replace(/\D/g, "");
}

/** A value that is empty, all zeros, or too short to dial. */
function isPlaceholderNumber(digits: string): boolean {
  const bare = digits.replace(/^\+/, "");
  return bare.length < 8 || /^0+$/.test(bare);
}

/* ------------------------------------------------------------------ */
/* Availability                                                        */
/* ------------------------------------------------------------------ */

export function isPhoneConfigured(): boolean {
  if (!siteConfig.features.phoneEnabled) return false;
  return !isPlaceholderNumber(normalizePhone(siteConfig.contact.phone));
}

export function isWhatsappConfigured(): boolean {
  if (!siteConfig.features.whatsappEnabled) return false;
  return !isPlaceholderNumber(normalizeWhatsapp(siteConfig.contact.whatsapp));
}

export function isEmailConfigured(): boolean {
  if (!siteConfig.features.emailEnabled) return false;
  const email = siteConfig.contact.email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && !/(^|\.)example\.(com|org|net)$/i.test(email.split("@")[1] ?? "");
}

/* ------------------------------------------------------------------ */
/* Hrefs — only ever called behind the checks above                    */
/* ------------------------------------------------------------------ */

export function telHref(): string {
  return `tel:${normalizePhone(siteConfig.contact.phone)}`;
}

export function mailtoHref(subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  return `mailto:${siteConfig.contact.email.trim()}${query ? `?${query}` : ""}`;
}

export function whatsappHref(text?: string): string {
  const number = normalizeWhatsapp(siteConfig.contact.whatsapp);
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** True when at least one contact channel actually works. */
export function hasAnyContactChannel(): boolean {
  return isPhoneConfigured() || isWhatsappConfigured() || isEmailConfigured();
}
