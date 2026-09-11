import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIMITS,
  validateContactRequest,
  validateQuoteRequest,
} from "../lib/server/validate-quote.ts";
import { FIELD_LIMITS } from "../lib/form-limits.ts";

/**
 * THE GATE ON EVERY SUBMISSION
 * --------------------------------------------------------------------
 * This decides whether a buyer's request is accepted. Two failure modes
 * matter, and they pull in opposite directions:
 *
 *   REJECTING A REAL BUYER is the expensive one. These are farmers and
 *   traders in Iraq on rural connections — a validator that insists on a
 *   western phone format, or a company name, loses the sale silently.
 *
 *   ACCEPTING RUBBISH means unbounded strings and objects reach the
 *   database and the sales team's inbox.
 *
 * Both directions are asserted here.
 */

const validQuote = () => ({
  buyer: { name: "Dilan", company: "", email: "", phone: "07501234567", whatsapp: "" },
  orderType: "farm",
  products: [{ uid: "u1", productId: "p1", slug: "premium-round-bale", name: "Premium", format: "Round", quantity: 40, image: "" }],
  delivery: { country: "Iraq", region: "Erbil", preferredDate: "", unloadEquipment: "yes", notes: "" },
  requirements: {},
  supplyMode: "one-time",
  frequency: null,
  frequencyNote: "",
  calculatorEstimate: null,
  notes: "",
  marketingConsent: false,
  source: "quote-wizard",
});

const fields = (result: { ok: boolean; errors?: { field: string }[] }) =>
  (result.errors ?? []).map((e) => e.field);

/* ------------------------------------------------- accepting buyers */

test("a realistic request is accepted", () => {
  assert.equal(validateQuoteRequest(validQuote()).ok, true);
});

test("a phone number alone is enough — no email required", () => {
  const input = { ...validQuote(), buyer: { name: "Dilan", company: "", email: "", phone: "0750 123 4567", whatsapp: "" } };
  assert.equal(validateQuoteRequest(input).ok, true);
});

test("WhatsApp alone is enough", () => {
  const input = { ...validQuote(), buyer: { name: "Dilan", company: "", email: "", phone: "", whatsapp: "+964 750 123 4567" } };
  assert.equal(validateQuoteRequest(input).ok, true);
});

test("a company name is never required", () => {
  const input = { ...validQuote(), buyer: { name: "Dilan", company: "", email: "d@example.com", phone: "", whatsapp: "" } };
  assert.equal(validateQuoteRequest(input).ok, true);
});

test("local and international phone formats are both accepted", () => {
  for (const phone of ["07501234567", "+9647501234567", "0750 123 4567", "(0750) 123-4567", "٠٧٥٠١٢٣٤٥٦٧".replace(/\D/g, "0750123")]) {
    const input = { ...validQuote(), buyer: { name: "D", company: "", email: "", phone, whatsapp: "" } };
    assert.equal(validateQuoteRequest(input).ok, true, `rejected a real format: ${phone}`);
  }
});

test("a non-Latin name is accepted", () => {
  const input = { ...validQuote(), buyer: { name: "دلێر محەمەد", company: "", email: "", phone: "07501234567", whatsapp: "" } };
  assert.equal(validateQuoteRequest(input).ok, true);
});

test("an enquiry with no products at all is accepted", () => {
  // A buyer may ask a general question through the quote flow.
  const input = { ...validQuote(), products: [] };
  assert.equal(validateQuoteRequest(input).ok, true);
});

/* ------------------------------------------------ rejecting rubbish */

test("a request with no contact method at all is refused", () => {
  const input = { ...validQuote(), buyer: { name: "Dilan", company: "", email: "", phone: "", whatsapp: "" } };
  const result = validateQuoteRequest(input);
  assert.equal(result.ok, false);
  assert.ok(fields(result).includes("buyer"));
});

test("a missing name is refused", () => {
  const input = { ...validQuote(), buyer: { name: "", company: "", email: "d@example.com", phone: "", whatsapp: "" } };
  assert.ok(fields(validateQuoteRequest(input)).includes("buyer.name"));
});

test("a malformed email is refused", () => {
  const input = { ...validQuote(), buyer: { name: "D", company: "", email: "not-an-email", phone: "", whatsapp: "" } };
  assert.ok(fields(validateQuoteRequest(input)).includes("buyer.email"));
});

test("an unknown order type is refused rather than silently defaulted", () => {
  const input = { ...validQuote(), orderType: "wholesale" };
  assert.ok(fields(validateQuoteRequest(input)).includes("orderType"));
});

test("a non-object payload is refused", () => {
  for (const bad of [null, undefined, "string", 42, [], true]) {
    assert.equal(validateQuoteRequest(bad).ok, false, `accepted ${JSON.stringify(bad)}`);
  }
});

/* ------------------------------------------------------ boundaries */

test("overlong free text is refused with a message naming the field", () => {
  /*
   * Refused, NOT silently truncated. Cutting a buyer's "the gate is 3m
   * wide, deliver before the 15th" in half would lose the part that
   * mattered and they would never know.
   *
   * The inputs carry the same cap from lib/form-limits.ts, so the
   * browser stops them at the limit and this is the backstop rather
   * than the first anyone hears of it. The wizard also renders these
   * messages, so a rejection is always actionable.
   */
  const input = { ...validQuote(), notes: "x".repeat(LIMITS.maxNotes * 3) };
  const result = validateQuoteRequest(input);
  assert.equal(result.ok, false);
  assert.ok(fields(result).includes("notes"));
  assert.match(result.errors![0]!.message, new RegExp(String(LIMITS.maxNotes)));
});

test("the browser cap and the server cap are the same number", () => {
  // Two sources would mean an input that lets a buyer type something
  // the server then refuses.
  assert.equal(LIMITS.maxNotes, FIELD_LIMITS.maxNotes);
  assert.equal(LIMITS.maxShortText, FIELD_LIMITS.maxShortText);
  assert.equal(LIMITS.maxEmail, FIELD_LIMITS.maxEmail);
});

test("more line items than allowed is refused, not silently truncated", () => {
  const line = validQuote().products[0]!;
  const input = { ...validQuote(), products: Array.from({ length: LIMITS.maxItems + 5 }, () => ({ ...line })) };
  assert.ok(fields(validateQuoteRequest(input)).includes("products"));
});

test("hostile quantities cannot reach the database", () => {
  for (const quantity of [NaN, Infinity, -5, 1e12, "40; DROP TABLE", null]) {
    const line = { ...validQuote().products[0]!, quantity } as unknown;
    const result = validateQuoteRequest({ ...validQuote(), products: [line] });
    if (result.ok) {
      const stored = result.value.products[0]!.quantity;
      assert.ok(Number.isFinite(stored) && stored > 0 && stored <= LIMITS.maxQuantity,
        `quantity ${String(quantity)} survived as ${String(stored)}`);
    }
  }
});

test("whitespace is collapsed so a padded name is not treated as missing", () => {
  const input = { ...validQuote(), buyer: { name: "  Dilan   Ahmed  ", company: "", email: "", phone: "07501234567", whatsapp: "" } };
  const result = validateQuoteRequest(input);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.value.buyer.name, "Dilan Ahmed");
});

test("every problem is reported at once, not one per round trip", () => {
  const result = validateQuoteRequest({ buyer: {}, orderType: "nope", products: [] });
  assert.ok((result.errors ?? []).length >= 2);
});

/* -------------------------------------------------------- enquiries */

test("a realistic enquiry is accepted", () => {
  const result = validateContactRequest({
    name: "Dilan", company: "", phone: "07501234567", email: "",
    country: "Iraq", city: "Duhok", message: "Do you deliver to Duhok?",
  });
  assert.equal(result.ok, true);
});

test("an enquiry with no message is refused", () => {
  const result = validateContactRequest({ name: "Dilan", phone: "07501234567", message: "" });
  assert.ok(fields(result).includes("message"));
});

test("an enquiry with no way to reply is refused", () => {
  const result = validateContactRequest({ name: "Dilan", email: "", phone: "", message: "Hello" });
  assert.ok(fields(result).includes("contact"));
});

test("REGRESSION: an enquiry is not judged by the quote rules", () => {
  // /api/quote ignored the envelope's `type` and ran every submission
  // through validateQuoteRequest, so an enquiry failed on the missing
  // orderType, products and delivery and returned 422 every time.
  const enquiry = { name: "Dilan", phone: "07501234567", message: "Do you deliver to Duhok?" };
  assert.equal(validateContactRequest(enquiry).ok, true);
  assert.equal(validateQuoteRequest(enquiry).ok, false, "the quote validator should reject it — that is the point");
});

test("the server stamps its own timestamp, ignoring the client's", () => {
  const result = validateContactRequest({
    name: "D", phone: "07501234567", message: "hi", submittedAt: "1999-01-01T00:00:00.000Z",
  });
  assert.equal(result.ok, true);
  assert.notEqual(result.ok && result.value.submittedAt, "1999-01-01T00:00:00.000Z");
});
