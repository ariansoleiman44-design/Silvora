import type { QuoteRequest } from "@/types/quote";
import { buildQuoteSummary, frequencyLabels, orderKindLabels } from "@/lib/quote-summary";
import { siteConfig } from "@/data/site-config";

/**
 * RFQ EMAILS
 * --------------------------------------------------------------------
 * Plain text on purpose. Sales staff read these on a phone, often in a
 * field, sometimes forwarded through WhatsApp. HTML adds nothing and
 * breaks in half the places this will be opened.
 *
 * The internal email leads with what decides whether to act: order type,
 * volume, region. The buyer confirmation contains only what the buyer
 * themselves submitted, and promises nothing about response times —
 * those are a business decision, not a template default.
 */

export interface MailContent {
  subject: string;
  text: string;
}

const totalBales = (request: QuoteRequest) =>
  request.products.reduce((sum, item) => sum + item.quantity, 0);

/** Sales notification. Subject carries the decision-making facts. */
export function internalEmail(request: QuoteRequest): MailContent {
  const bales = totalBales(request);
  const region = [request.delivery.region, request.delivery.country].filter(Boolean).join(", ");

  const subjectParts = [
    `New ${siteConfig.brandName} RFQ`,
    orderKindLabels[request.orderType],
    bales ? `${bales} bales` : null,
    request.reference,
  ].filter(Boolean);

  const supply =
    request.supplyMode === "recurring"
      ? request.frequency === "custom"
        ? `Recurring — ${request.frequencyNote || "custom schedule"}`
        : `Recurring — ${request.frequency ? frequencyLabels[request.frequency] : ""}`
      : "One-time order";

  const header = [
    `Reference:  ${request.reference}`,
    `Received:   ${request.createdAt}`,
    `Order type: ${orderKindLabels[request.orderType]}`,
    `Supply:     ${supply}`,
    bales ? `Bales:      ${bales}` : null,
    region ? `Region:     ${region}` : null,
    `Source:     ${request.source}`,
  ]
    .filter(Boolean)
    .join("\n");

  const reachOut = [
    request.buyer.phone ? `Call:     ${request.buyer.phone}` : null,
    request.buyer.whatsapp ? `WhatsApp: https://wa.me/${request.buyer.whatsapp.replace(/\D/g, "")}` : null,
    request.buyer.email ? `Email:    ${request.buyer.email}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const text = [
    header,
    "",
    "REPLY TO THE BUYER",
    reachOut,
    "",
    "─".repeat(48),
    "",
    buildQuoteSummary(request),
  ].join("\n");

  return { subject: subjectParts.join(" — "), text };
}

/**
 * Buyer acknowledgement. Only sent when explicitly enabled
 * (QUOTE_EMAIL_CONFIRM_BUYER=true).
 *
 * No response-time promise: the business has not configured one, and
 * inventing "within 24 hours" creates an obligation nobody agreed to.
 */
export function buyerEmail(request: QuoteRequest): MailContent {
  const bales = totalBales(request);
  const lines = request.products.map(
    (item) => `  • ${item.name} — ${item.quantity} bales (${item.format})`,
  );
  const region = [request.delivery.region, request.delivery.country].filter(Boolean).join(", ");

  const text = [
    `We received your ${siteConfig.brandName} request.`,
    "",
    `Reference: ${request.reference}`,
    "",
    lines.length ? "What you asked for:" : "You did not select specific products.",
    ...lines,
    bales ? `\n  Total: ${bales} bales` : "",
    region ? `\nDelivery region: ${region}` : "",
    "",
    "Our team will review your requirements and confirm availability,",
    "specifications and logistics.",
    "",
    "Pricing is quoted on quantity, destination, season and logistics.",
    "",
    "The details you sent us:",
    [
      request.buyer.name ? `  Name:     ${request.buyer.name}` : null,
      request.buyer.company ? `  Company:  ${request.buyer.company}` : null,
      request.buyer.phone ? `  Phone:    ${request.buyer.phone}` : null,
      request.buyer.whatsapp ? `  WhatsApp: ${request.buyer.whatsapp}` : null,
      request.buyer.email ? `  Email:    ${request.buyer.email}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    "",
    "If anything above is wrong, reply to this message and tell us.",
    "",
    siteConfig.brandName,
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return {
    subject: `We received your ${siteConfig.brandName} request — ${request.reference}`,
    text,
  };
}
