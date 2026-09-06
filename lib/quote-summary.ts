import type { QuoteRequest, SupplyFrequency } from "@/types/quote";
import { siteConfig } from "@/data/site-config";
import { formatNumber, formatTonnes } from "@/lib/utils";

/**
 * PLAIN-TEXT RFQ SUMMARY
 * --------------------------------------------------------------------
 * One function, two consumers: the clipboard ("copy request summary")
 * and the WhatsApp handoff. Plain text on purpose — it has to survive
 * being pasted into WhatsApp, an email, or a procurement system.
 *
 * Nothing here invents a price, a lead time or a delivery date.
 */

/**
 * Default (English) label maps. The UI passes the reader's language in;
 * the server-side sales email keeps these, so the team always receives
 * notifications in one consistent language whatever the buyer read.
 */
export const orderKindLabels: Record<QuoteRequest["orderType"], string> = {
  farm: "Farm order",
  commercial: "Commercial supply",
  distributor: "Distributor / reseller",
  export: "Export enquiry",
};

export const frequencyLabels: Record<SupplyFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  custom: "Custom schedule",
};

function line(label: string, value?: string | number | null): string | null {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v ? `${label}: ${v}` : null;
}

function block(title: string, lines: (string | null)[]): string | null {
  const body = lines.filter((l): l is string => Boolean(l));
  return body.length ? `${title}\n${body.join("\n")}` : null;
}

/**
 * Render the request as text. `compact` drops the softer sections for
 * WhatsApp, where a wall of text is worse than a short one.
 */
export interface SummaryLabels {
  orderKinds: Record<QuoteRequest["orderType"], string>;
  frequencies: Record<SupplyFrequency, string>;
}

export function buildQuoteSummary(
  req: QuoteRequest,
  { compact = false, labels }: { compact?: boolean; labels?: SummaryLabels } = {},
): string {
  const orderKind = labels?.orderKinds ?? orderKindLabels;
  const frequency = labels?.frequencies ?? frequencyLabels;
  const r = req.requirements;

  const products = req.products.length
    ? req.products
        .map((i) => {
          const bits = [`• ${i.name} — ${formatNumber(i.quantity)} bales`, `(${i.format})`];
          if (i.frequency) bits.push(`— ${frequency[i.frequency]}`);
          const head = bits.join(" ");
          return i.notes ? `${head}\n  Note: ${i.notes}` : head;
        })
        .join("\n")
    : "No products selected";

  const supply =
    req.supplyMode === "recurring"
      ? req.frequency
        ? req.frequency === "custom"
          ? `Recurring — ${req.frequencyNote || "custom schedule"}`
          : `Recurring — ${frequency[req.frequency]}`
        : "Recurring supply"
      : "One-time order";

  const sections: (string | null)[] = [
    `${siteConfig.brandName} — QUOTE REQUEST`,
    line("Reference", req.reference),
    "",
    block("PRODUCTS", [products]),
    block("ORDER", [
      line("Type", orderKind[req.orderType]),
      line("Supply", supply),
      line("Total bales", req.products.reduce((n, i) => n + i.quantity, 0) || null),
    ]),
    block("REQUIREMENTS", [
      line("Estimated quantity", r.estimatedQuantity),
      line("Livestock", r.livestock),
      line("Number of animals", r.animalCount),
      line("Monthly volume", r.monthlyVolume),
      line("Preferred format", r.preferredFormat),
      line("Contract length", r.contractLength),
      line("Resale territory", r.resaleTerritory),
      line("Packaging", r.packagingRequirements),
      line("Private label", r.privateLabelInterest),
      line("Destination country", r.destinationCountry),
      line("Destination port", r.destinationPort),
      line("Load preference", r.loadPreference),
      line("Incoterm", r.incoterm),
      r.labDataRequested ? "Laboratory / batch specifications requested" : null,
    ]),
    block("DELIVERY", [
      line("Country", req.delivery.country),
      line("Region / city", req.delivery.region),
      line("Delivery required", r.deliveryRequired),
      line("Preferred date", req.delivery.preferredDate),
      line("Unloading equipment on site", req.delivery.unloadEquipment),
      compact ? null : line("Delivery notes", req.delivery.notes),
    ]),
    compact || !req.calculatorEstimate
      ? null
      : block("PLANNING ESTIMATE", [
          line("Animals", formatNumber(req.calculatorEstimate.animals)),
          line("Feeding days", formatNumber(req.calculatorEstimate.days)),
          line("Total requirement", formatTonnes(req.calculatorEstimate.totalKg)),
          line("Bales incl. reserve", formatNumber(req.calculatorEstimate.balesWithReserve)),
          "Planning estimate only — not a ration recommendation.",
        ]),
    block("BUYER", [
      line("Name", req.buyer.name),
      line("Company", req.buyer.company),
      line("Phone", req.buyer.phone),
      line("WhatsApp", req.buyer.whatsapp),
      line("Email", req.buyer.email),
    ]),
    compact ? null : block("NOTES", [req.notes || null]),
    "",
    "Pricing is quoted on quantity, destination, season and logistics.",
  ];

  return sections
    .filter((s): s is string => s !== null)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Short version for the WhatsApp message body. */
export function buildWhatsappMessage(req: QuoteRequest, labels?: SummaryLabels): string {
  return buildQuoteSummary(req, { compact: true, labels });
}

/**
 * Clipboard write with a `document.execCommand` fallback for browsers
 * (and insecure contexts) where the async Clipboard API is unavailable.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
