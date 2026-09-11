import { test } from "node:test";
import assert from "node:assert/strict";
import type { Product } from "../types/product.ts";
import {
  applyPatch,
  factsOnly,
  isClearable,
  sanitisePatch,
  validatePatch,
} from "../lib/product-schema.ts";

/**
 * THE PRODUCT OVERRIDE RULES
 * --------------------------------------------------------------------
 * These are the guarantees the whole overlay design rests on:
 *
 *   - a translation can never change a measurement or an availability
 *   - a base edit reaches every language
 *   - an unedited product renders exactly what is committed
 *   - typing a real figure clears the "unverified" marker, and only
 *     from the English record
 *
 * Each was a real defect at some point. This imports the actual module
 * the admin panel uses — not a copy — so the rules cannot drift.
 */

const base = (): Product =>
  ({
    id: "p1",
    slug: "premium-round-bale",
    name: "Premium Round Bale",
    shortName: "Premium Round",
    category: "Round Bales",
    format: "round",
    application: ["dairy"],
    orderType: ["commercial"],
    tagline: "Committed tagline.",
    shortDescription: "Committed short description.",
    description: ["Committed paragraph."],
    images: ["homeHero"],
    availability: "available",
    features: ["a"],
    bestFor: ["b"],
    storageGuidance: ["c"],
    handling: ["d"],
    deliveryNotes: ["e"],
    weight: { label: "Approx. weight", value: "≈ 600 kg", demo: true },
    nutrition: [
      { key: "dryMatter", label: "Dry matter", unit: "%", value: 34, demo: true },
    ],
  }) as unknown as Product;

/* ---------------------------------------------------------- layering */

test("an empty patch leaves the committed product untouched", () => {
  const result = applyPatch(base(), {}, "en");
  assert.deepEqual(result, base());
});

test("a base patch reaches the product", () => {
  const result = applyPatch(base(), { tagline: "Edited" }, "en");
  assert.equal(result.tagline, "Edited");
});

/* ------------------------------------------- facts vs. translations */

test("a translation may not carry a fact", () => {
  const problems = validatePatch({ availability: "limited" }, "ar");
  assert.equal(problems.length, 1);
  assert.match(problems[0]!.message, /English record/);
});

test("factsOnly keeps facts and drops prose", () => {
  const only = factsOnly({ availability: "limited", tagline: "English prose" });
  assert.deepEqual(only, { availability: "limited" });
});

test("REGRESSION: English prose must not cross into another language", () => {
  // The base patch is applied to every locale, so an English tagline
  // would have appeared verbatim on the Arabic page.
  const forArabic = factsOnly({ availability: "limited", tagline: "English prose" });
  const result = applyPatch(base(), forArabic, "ar");
  assert.equal(result.availability, "limited", "the fact must cross");
  assert.equal(result.tagline, "Committed tagline.", "the prose must not");
});

/* ------------------------------------------------- the demo marker */

test("a real figure on the English record clears the unverified marker", () => {
  const result = applyPatch(base(), { specs: { weight: { value: "612 kg" } } }, "en");
  assert.equal(result.weight!.value, "612 kg");
  assert.equal(result.weight!.demo, undefined);
});

test("REGRESSION: a translation never clears the unverified marker", () => {
  // Rewording a number in Kurdish does not make it measured.
  const result = applyPatch(base(), { specs: { weight: { value: "٦٠٠ كغم" } } }, "ar");
  assert.equal(result.weight!.demo, true);
});

test("editing only the label leaves the marker alone", () => {
  const result = applyPatch(base(), { specs: { weight: { label: "Weight" } } }, "en");
  assert.equal(result.weight!.demo, true);
});

/* ------------------------------------------------------- clearing */

test("null clears a field that is allowed to be cleared", () => {
  const result = applyPatch(base(), { badge: null }, "en");
  assert.equal("badge" in result, false);
});

test("a required field cannot be cleared", () => {
  assert.equal(isClearable("badge"), true);
  assert.equal(isClearable("name"), false);
});

/* ------------------------------------------ nutrition labels + faq */

test("REGRESSION: nutrition labels map onto the entries, not a stray field", () => {
  // Assigning generically set product.nutritionLabels, which nothing
  // reads — every translated label was silently lost.
  const result = applyPatch(base(), { nutritionLabels: { dryMatter: "المادة الجافة" } }, "ar");
  assert.equal(result.nutrition![0]!.label, "المادة الجافة");
  assert.equal((result as Record<string, unknown>).nutritionLabels, undefined);
});

test("a nutrition label change never touches the measured number", () => {
  const result = applyPatch(base(), { nutritionLabels: { dryMatter: "المادة الجافة" } }, "ar");
  assert.equal(result.nutrition![0]!.value, 34);
  assert.equal(result.nutrition![0]!.key, "dryMatter");
});

test("REGRESSION: faq and nutritionLabels are accepted from a translation", () => {
  // They are applied by translateProduct but were missing from
  // TRANSLATION_FIELDS, so the panel rejected translations the
  // committed files already contained.
  const problems = validatePatch(
    { faq: [{ question: "س", answer: "ج" }], nutritionLabels: { dryMatter: "المادة الجافة" } },
    "ar",
  );
  assert.deepEqual(problems, []);
});

test("a half-filled faq entry is dropped rather than rendered", () => {
  const clean = sanitisePatch({ faq: [{ question: "Q", answer: "" }] }, "ar");
  assert.equal("faq" in clean, false);
});

/* ------------------------------------------------------ hardening */

test("identity and machine keys are refused", () => {
  for (const field of ["slug", "id", "images", "format", "application", "orderType"]) {
    const problems = validatePatch({ [field]: "anything" }, "en");
    assert.equal(problems.length, 1, `${field} must be refused`);
  }
});

test("a demo flag cannot be asserted from the panel", () => {
  const problems = validatePatch({ specs: { weight: { demo: false } } }, "en");
  assert.ok(problems.some((p) => p.field === "specs.weight.demo"));
});

test("sanitise drops anything validation would have refused", () => {
  const clean = sanitisePatch({ slug: "hijacked", tagline: "kept" }, "en");
  assert.deepEqual(clean, { tagline: "kept" });
});

test("every problem is reported, not just the first", () => {
  const problems = validatePatch({ slug: "x", id: "y", images: "z" }, "en");
  assert.equal(problems.length, 3);
});
