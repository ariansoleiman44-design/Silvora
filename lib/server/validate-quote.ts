import type {
  CalculatorEstimate,
  ContactRequest,
  OrderKind,
  QuoteItem,
  QuoteRequest,
  SupplyFrequency,
  SupplyMode,
} from "@/types/quote";

/**
 * SERVER-SIDE VALIDATION
 * --------------------------------------------------------------------
 * Browser validation is a courtesy to the buyer. This is the real
 * gate: every field arriving at /api/quote is untrusted, including
 * fields the wizard "always" sends.
 *
 * Hand-written rather than schema-library-driven — the shape is small,
 * stable and documented in docs/QUOTE-API.md, and a dependency here
 * would be carried by the server bundle for no gain.
 *
 * Philosophy: reject what is malformed or abusive, tolerate what is
 * merely untidy. An agricultural buyer typing a phone number with
 * spaces, dots and a country code in brackets must get through.
 */

export interface FieldError {
  field: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; value: QuoteRequest }
  | { ok: false; errors: FieldError[] };

export type ContactValidationResult =
  | { ok: true; value: ContactRequest }
  | { ok: false; errors: FieldError[] };

/* ------------------------------------------------------------------ */
/* Limits                                                              */
/* ------------------------------------------------------------------ */

export const LIMITS = {
  /** Rejected before parsing — see the route handler. */
  maxBodyBytes: 128 * 1024,
  maxItems: 50,
  maxQuantity: 1_000_000,
  maxNotes: 5_000,
  maxShortText: 200,
  maxEmail: 254,
} as const;

const ORDER_KINDS: OrderKind[] = ["farm", "commercial", "distributor", "export"];
const SUPPLY_MODES: SupplyMode[] = ["one-time", "recurring"];
const FREQUENCIES: SupplyFrequency[] = ["weekly", "biweekly", "monthly", "custom"];

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Trim, collapse whitespace, cap length. Non-strings become "". */
function str(value: unknown, max: number = LIMITS.maxShortText): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** Multi-line text: keep newlines, cap length. */
function text(value: unknown, max: number = LIMITS.maxNotes): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, max);
}

function finiteNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

// Deliberately permissive: one @, a dot in the domain, no spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** At least 6 digits somewhere. No country-code guessing, no format rules. */
function looksLikePhone(value: string): boolean {
  return value.replace(/\D/g, "").length >= 6;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export function validateQuoteRequest(input: unknown): ValidationResult {
  const errors: FieldError[] = [];
  const fail = (field: string, message: string) => errors.push({ field, message });

  if (!isObject(input)) {
    return { ok: false, errors: [{ field: "payload", message: "Expected an object" }] };
  }

  /* -------------------------------------------------------- buyer -- */
  const buyerIn = isObject(input.buyer) ? input.buyer : {};
  const buyer = {
    name: str(buyerIn.name),
    company: str(buyerIn.company),
    email: str(buyerIn.email, LIMITS.maxEmail).toLowerCase(),
    phone: str(buyerIn.phone, 40),
    whatsapp: str(buyerIn.whatsapp, 40),
  };

  if (!buyer.name) fail("buyer.name", "A name is required");
  if (buyer.email && !EMAIL_RE.test(buyer.email)) {
    fail("buyer.email", "That email address does not look valid");
  }
  if (buyer.phone && !looksLikePhone(buyer.phone)) {
    fail("buyer.phone", "That phone number does not look valid");
  }
  if (buyer.whatsapp && !looksLikePhone(buyer.whatsapp)) {
    fail("buyer.whatsapp", "That WhatsApp number does not look valid");
  }
  if (!buyer.email && !buyer.phone && !buyer.whatsapp) {
    fail("buyer", "At least one contact method is required");
  }

  /* --------------------------------------------------- order type -- */
  const orderType = ORDER_KINDS.includes(input.orderType as OrderKind)
    ? (input.orderType as OrderKind)
    : null;
  if (!orderType) fail("orderType", `Must be one of: ${ORDER_KINDS.join(", ")}`);

  /* ------------------------------------------------------ products - */
  const rawProducts = Array.isArray(input.products) ? input.products : [];
  if (rawProducts.length > LIMITS.maxItems) {
    fail("products", `At most ${LIMITS.maxItems} lines`);
  }

  const products: QuoteItem[] = [];
  rawProducts.slice(0, LIMITS.maxItems).forEach((raw, i) => {
    if (!isObject(raw)) {
      fail(`products[${i}]`, "Expected an object");
      return;
    }
    const quantity = finiteNumber(raw.quantity);
    if (quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
      fail(`products[${i}].quantity`, "Quantity must be a whole number greater than zero");
      return;
    }
    if (quantity > LIMITS.maxQuantity) {
      fail(`products[${i}].quantity`, `Quantity must be ${LIMITS.maxQuantity} or less`);
      return;
    }
    const slug = str(raw.slug, 120);
    if (!slug) {
      fail(`products[${i}].slug`, "A product slug is required");
      return;
    }
    products.push({
      uid: str(raw.uid, 40) || `line-${i}`,
      productId: str(raw.productId, 60),
      slug,
      name: str(raw.name, 160),
      format: str(raw.format, 60),
      quantity,
      image: str(raw.image, 500),
      frequency: FREQUENCIES.includes(raw.frequency as SupplyFrequency)
        ? (raw.frequency as SupplyFrequency)
        : undefined,
      notes: text(raw.notes, 1_000) || undefined,
    });
  });

  /* -------------------------------------------------------- supply - */
  const supplyMode = SUPPLY_MODES.includes(input.supplyMode as SupplyMode)
    ? (input.supplyMode as SupplyMode)
    : "one-time";

  let frequency: SupplyFrequency | null = FREQUENCIES.includes(input.frequency as SupplyFrequency)
    ? (input.frequency as SupplyFrequency)
    : null;
  if (supplyMode === "one-time") frequency = null;
  if (supplyMode === "recurring" && !frequency) {
    fail("frequency", `Recurring supply needs one of: ${FREQUENCIES.join(", ")}`);
  }

  /* -------------------------------------------------- requirements - */
  const reqIn = isObject(input.requirements) ? input.requirements : {};
  const yesNo = (v: unknown): "yes" | "no" | "" =>
    v === "yes" || v === "no" ? v : "";
  const requirements = {
    estimatedQuantity: str(reqIn.estimatedQuantity, 60) || undefined,
    labDataRequested: reqIn.labDataRequested === true || undefined,
    livestock: str(reqIn.livestock) || undefined,
    animalCount: str(reqIn.animalCount, 60) || undefined,
    deliveryRequired: yesNo(reqIn.deliveryRequired) || undefined,
    monthlyVolume: str(reqIn.monthlyVolume) || undefined,
    preferredFormat: str(reqIn.preferredFormat) || undefined,
    contractLength: str(reqIn.contractLength) || undefined,
    resaleTerritory: str(reqIn.resaleTerritory) || undefined,
    packagingRequirements: str(reqIn.packagingRequirements, 500) || undefined,
    privateLabelInterest: yesNo(reqIn.privateLabelInterest) || undefined,
    destinationCountry: str(reqIn.destinationCountry) || undefined,
    destinationPort: str(reqIn.destinationPort) || undefined,
    loadPreference: str(reqIn.loadPreference) || undefined,
    incoterm: str(reqIn.incoterm, 60) || undefined,
  };

  /* ------------------------------------------------------ delivery - */
  const delIn = isObject(input.delivery) ? input.delivery : {};
  const preferredDate = str(delIn.preferredDate, 20);
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    fail("delivery.preferredDate", "Expected a yyyy-mm-dd date");
  }
  const delivery = {
    country: str(delIn.country),
    region: str(delIn.region),
    preferredDate: /^\d{4}-\d{2}-\d{2}$/.test(preferredDate) ? preferredDate : "",
    unloadEquipment: yesNo(delIn.unloadEquipment),
    notes: text(delIn.notes, 2_000),
  };

  /* ----------------------------------------------------- estimate -- */
  let calculatorEstimate: CalculatorEstimate | null = null;
  if (isObject(input.calculatorEstimate)) {
    const e = input.calculatorEstimate;
    const num = (key: string) => finiteNumber(e[key]) ?? 0;
    const negative = [
      "animals",
      "perAnimalPerDay",
      "days",
      "usablePerBale",
      "totalKg",
      "bales",
      "balesWithReserve",
    ].some((key) => num(key) < 0);
    if (negative) {
      fail("calculatorEstimate", "Estimate contains negative values");
    } else {
      calculatorEstimate = {
        mode: e.mode === "herd" ? "herd" : "quick",
        animalType: str(e.animalType) || undefined,
        animals: num("animals"),
        perAnimalPerDay: num("perAnimalPerDay"),
        days: num("days"),
        usablePerBale: num("usablePerBale"),
        wastePercent: num("wastePercent"),
        reservePercent: num("reservePercent"),
        totalKg: num("totalKg"),
        bales: num("bales"),
        reserveBales: num("reserveBales"),
        balesWithReserve: num("balesWithReserve"),
        weeklyKg: num("weeklyKg"),
        monthlyKg: num("monthlyKg"),
      };
    }
  }

  /* --------------------------------------------------------- rest -- */
  const notes = text(input.notes, LIMITS.maxNotes);
  if (typeof input.notes === "string" && input.notes.length > LIMITS.maxNotes) {
    fail("notes", `Notes must be ${LIMITS.maxNotes} characters or fewer`);
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      // The client reference is advisory only; the route replaces it
      // with the server-issued one. See lib/server/reference.ts.
      reference: str(input.reference, 40),
      createdAt: new Date().toISOString(),
      orderType: orderType!,
      buyer,
      company: buyer.company,
      products,
      requirements,
      delivery,
      supplyMode,
      frequency,
      frequencyNote: str(input.frequencyNote, 500),
      calculatorEstimate,
      notes,
      marketingConsent: input.marketingConsent === true,
      source: str(input.source, 60) || "unknown",
    },
  };
}

/* ------------------------------------------------------------------ */
/* Contact form                                                        */
/* ------------------------------------------------------------------ */

/**
 * The general enquiry form is NOT a quote. It has no products, no
 * delivery block and no order type, so running it through
 * validateQuoteRequest rejects every submission — which is exactly what
 * used to happen, because /api/quote ignored the envelope's `type`.
 *
 * Same philosophy as above: reject malformed or abusive, tolerate
 * untidy. A message is required here where it is optional on a quote,
 * because on this form the message IS the request.
 */
export function validateContactRequest(input: unknown): ContactValidationResult {
  const errors: FieldError[] = [];
  const fail = (field: string, message: string) => errors.push({ field, message });

  if (!isObject(input)) {
    return { ok: false, errors: [{ field: "payload", message: "Expected an object" }] };
  }

  const value: ContactRequest = {
    name: str(input.name),
    company: str(input.company),
    phone: str(input.phone, 40),
    email: str(input.email, LIMITS.maxEmail).toLowerCase(),
    country: str(input.country),
    city: str(input.city),
    message: text(input.message),
    // Client-supplied timestamps are advisory; the server stamps its own.
    submittedAt: new Date().toISOString(),
  };

  if (!value.name) fail("name", "A name is required");
  if (!value.message) fail("message", "A message is required");
  if (value.email && !EMAIL_RE.test(value.email)) {
    fail("email", "That email address does not look valid");
  }
  if (value.phone && !looksLikePhone(value.phone)) {
    fail("phone", "That phone number does not look valid");
  }
  if (!value.email && !value.phone) {
    fail("contact", "An email address or a phone number is required");
  }

  return errors.length ? { ok: false, errors } : { ok: true, value };
}
