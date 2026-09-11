import type { Availability, Product } from "@/types/product";
import type { ProductSpecKey, ProductTranslation } from "@/types/i18n";
import { PRODUCT_SPEC_KEYS } from "../types/i18n.ts";

/**
 * WHAT THE ADMIN PANEL IS ALLOWED TO CHANGE
 * --------------------------------------------------------------------
 * The panel does not replace data/products.ts. It writes PATCHES that
 * are layered over it (see lib/server/product-overrides.ts), so an
 * empty database renders exactly what is committed to git.
 *
 * This module defines which fields a patch may contain and validates
 * one before it is written. It is imported by the admin editor AND by
 * scripts/validate-data.mts, so the browser form and the command-line
 * check can never disagree about what counts as valid.
 *
 * It imports only types, so it runs under plain Node in the scripts.
 *
 * THE TWO LAYERS
 *
 *   locale "en"  the base patch. Product-wide facts live here:
 *                availability, harvest dates, machine keys. Changing
 *                one changes every language at once, which is the
 *                point — a bale's availability is not a translation.
 *
 *   other        a ProductTranslation, the exact shape the file
 *                overlays in data/ar, data/ckb and data/kmr already
 *                use. Text only.
 *
 * WHAT NO PATCH MAY EVER CONTAIN
 *
 *   slug, id       identity. Changing a slug silently breaks every
 *                  inbound link and every stored quote line.
 *   images         keys into data/media.ts; a value not in that file
 *                  renders a broken image.
 *   format,        machine keys that drive filters, search and the
 *   application,   Bale Finder. Editing them from a text box would
 *   orderType      desynchronise the catalogue from its own filters.
 *   demo           whether a figure is verified is a fact about the
 *                  data, not something an editor should be able to
 *                  silently assert. See clearing rules below.
 *   batches,       laboratory records. These come from a laboratory,
 *   nutrition      not from a form.
 */

/** Availability states, in the order the editor should offer them. */
export const AVAILABILITY_VALUES: Availability[] = [
  "available",
  "limited",
  "preorder",
  "seasonal",
  "contact",
  "unavailable",
];

/** Fields a base ("en") patch may set. */
export const BASE_FIELDS = [
  "name",
  "shortName",
  "category",
  "tagline",
  "shortDescription",
  "description",
  "badge",
  "features",
  "bestFor",
  "storageGuidance",
  "handling",
  "deliveryNotes",
  "keywords",
  "availability",
  "availabilityNote",
  "availableFrom",
  "availableUntil",
  "harvestSeason",
  "featured",
  "seo",
  "specs",
] as const;

export type BaseField = (typeof BASE_FIELDS)[number];

/**
 * The subset of a base patch that is a FACT about the product rather
 * than English prose.
 *
 * A base patch is applied under every language, which is right for
 * availability and measurements — a bale's supply state is not a
 * translation. It is wrong for prose: editing the English tagline used
 * to overwrite the committed Arabic one, turning /ar partly English
 * until someone also edited it there. Only these fields cross the
 * language boundary.
 *
 * `specs` is included because a spec row carries the measured value,
 * which must be identical everywhere. patchProduct applies it in a way
 * that still lets a locale keep its own translated label and prose
 * value — see lib/server/product-overrides.ts.
 */
export const BASE_FACT_FIELDS = [
  "availability",
  "availableFrom",
  "availableUntil",
  "harvestSeason",
  "featured",
  "specs",
] as const;

/** Keep only the fields a base patch may contribute to another language. */
export function factsOnly(patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of BASE_FACT_FIELDS) {
    if (field in patch) out[field] = patch[field];
  }
  return out;
}

/** Fields a translation patch may set. Mirrors ProductTranslation. */
export const TRANSLATION_FIELDS = [
  "name",
  "shortName",
  "category",
  "tagline",
  "shortDescription",
  "description",
  "badge",
  "features",
  "bestFor",
  "storageGuidance",
  "handling",
  "availabilityNote",
  "seo",
  "specs",
  /*
   * Both of these ARE translated by the file overlays and applied by
   * translateProduct in data/dictionaries.ts. They were missing here,
   * so the panel would have rejected a legitimate translation that the
   * committed files already contain — found by running validate:data
   * against the overlays with this very module.
   */
  "faq",
  "nutritionLabels",
] as const;

/** Free-text fields, and the cap each one is held to. */
export const TEXT_LIMITS: Record<string, number> = {
  faqQuestion: 300,
  faqAnswer: 1500,
  nutritionLabel: 80,
  name: 120,
  shortName: 60,
  category: 80,
  tagline: 200,
  shortDescription: 400,
  badge: 40,
  availabilityNote: 200,
  harvestSeason: 80,
  "seo.title": 120,
  "seo.description": 320,
  specLabel: 80,
  specValue: 160,
  specNote: 200,
  listItem: 400,
};

/** The longest a single list (features, bestFor, …) may become. */
export const MAX_LIST_ITEMS = 24;

/**
 * Fields an editor may deliberately empty, restoring the committed
 * value's ABSENCE rather than its content.
 *
 * Emptying a field used to produce an empty string, which sanitisePatch
 * discarded — so the patch was written without it, the committed value
 * reappeared, and the panel still said "Saved and published". A stale
 * badge or availability note could never be removed. A clear is now
 * stored as `null` and applyPatch deletes the field.
 *
 * The fields NOT listed here are ones a product cannot sensibly lack
 * (its name, category, tagline, short description). Emptying one of
 * those is rejected with a message rather than silently ignored.
 */
export const CLEARABLE_FIELDS = [
  "badge",
  "availabilityNote",
  "harvestSeason",
  "availableFrom",
  "availableUntil",
] as const;

export function isClearable(field: string): boolean {
  return (CLEARABLE_FIELDS as readonly string[]).includes(field);
}

/** Cap for one entry inside a list. Named so the checks below are total. */
const LIST_ITEM_LIMIT = TEXT_LIMITS.listItem ?? 400;

/** Lists of plain strings, valid in both layers. */
const STRING_LISTS = [
  "description",
  "features",
  "bestFor",
  "storageGuidance",
  "handling",
  "deliveryNotes",
  "keywords",
] as const;

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export interface PatchProblem {
  field: string;
  message: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function checkText(field: string, value: unknown, problems: PatchProblem[], limitKey = field): void {
  if (typeof value !== "string") {
    problems.push({ field, message: "must be text" });
    return;
  }
  const limit = TEXT_LIMITS[limitKey] ?? 400;
  if (value.length > limit) {
    problems.push({ field, message: `must be ${limit} characters or fewer (currently ${value.length})` });
  }
}

function checkStringList(field: string, value: unknown, problems: PatchProblem[]): void {
  if (!Array.isArray(value)) {
    problems.push({ field, message: "must be a list" });
    return;
  }
  if (value.length > MAX_LIST_ITEMS) {
    problems.push({ field, message: `must have ${MAX_LIST_ITEMS} items or fewer` });
  }
  value.forEach((item, index) => {
    if (typeof item !== "string") {
      problems.push({ field: `${field}[${index}]`, message: "must be text" });
    } else if (item.length > LIST_ITEM_LIMIT) {
      problems.push({ field: `${field}[${index}]`, message: `must be ${LIST_ITEM_LIMIT} characters or fewer` });
    } else if (!item.trim()) {
      problems.push({ field: `${field}[${index}]`, message: "is empty — remove the row instead" });
    }
  });
}

function checkSpecs(value: unknown, problems: PatchProblem[]): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    problems.push({ field: "specs", message: "must be an object" });
    return;
  }
  for (const [key, spec] of Object.entries(value as Record<string, unknown>)) {
    if (!(PRODUCT_SPEC_KEYS as string[]).includes(key)) {
      problems.push({ field: `specs.${key}`, message: "is not a known specification row" });
      continue;
    }
    if (typeof spec !== "object" || spec === null || Array.isArray(spec)) {
      problems.push({ field: `specs.${key}`, message: "must be an object" });
      continue;
    }
    const entry = spec as Record<string, unknown>;
    for (const [prop, propValue] of Object.entries(entry)) {
      if (prop === "demo") {
        // Not a mistake worth blocking a save over — it is stripped on
        // write — but say so rather than silently discarding it.
        problems.push({ field: `specs.${key}.demo`, message: "cannot be set from the panel" });
        continue;
      }
      if (!["label", "value", "note"].includes(prop)) {
        problems.push({ field: `specs.${key}.${prop}`, message: "is not an editable property" });
        continue;
      }
      const limitKey = prop === "label" ? "specLabel" : prop === "value" ? "specValue" : "specNote";
      checkText(`specs.${key}.${prop}`, propValue, problems, limitKey);
    }
  }
}

/** Per-product FAQ: a list of {question, answer}, both required. */
function checkFaq(value: unknown, problems: PatchProblem[]): void {
  if (!Array.isArray(value)) {
    problems.push({ field: "faq", message: "must be a list" });
    return;
  }
  if (value.length > MAX_LIST_ITEMS) {
    problems.push({ field: "faq", message: `must have ${MAX_LIST_ITEMS} entries or fewer` });
  }
  value.forEach((entry, index) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      problems.push({ field: `faq[${index}]`, message: "must be an object" });
      return;
    }
    const item = entry as Record<string, unknown>;
    for (const prop of ["question", "answer"] as const) {
      if (!(prop in item)) {
        problems.push({ field: `faq[${index}].${prop}`, message: "is required" });
        continue;
      }
      checkText(
        `faq[${index}].${prop}`,
        item[prop],
        problems,
        prop === "question" ? "faqQuestion" : "faqAnswer",
      );
    }
    for (const prop of Object.keys(item)) {
      if (prop !== "question" && prop !== "answer") {
        problems.push({ field: `faq[${index}].${prop}`, message: "is not an editable property" });
      }
    }
  });
}

/**
 * Nutrition LABELS only — the machine key and the measured number stay
 * in data/products.ts. Translating "Crude protein" is language work;
 * changing 7.8 is not.
 */
function checkNutritionLabels(value: unknown, problems: PatchProblem[]): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    problems.push({ field: "nutritionLabels", message: "must be an object keyed by nutrition key" });
    return;
  }
  for (const [key, label] of Object.entries(value as Record<string, unknown>)) {
    checkText(`nutritionLabels.${key}`, label, problems, "nutritionLabel");
  }
}

function checkSeo(value: unknown, problems: PatchProblem[]): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    problems.push({ field: "seo", message: "must be an object" });
    return;
  }
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key !== "title" && key !== "description") {
      problems.push({ field: `seo.${key}`, message: "is not an editable property" });
      continue;
    }
    checkText(`seo.${key}`, entry, problems, `seo.${key}`);
  }
}

/**
 * Validate one patch. Returns every problem rather than the first, so
 * the editor can mark all the offending fields at once.
 */
export function validatePatch(
  patch: Record<string, unknown>,
  locale: string,
): PatchProblem[] {
  const problems: PatchProblem[] = [];
  const allowed: readonly string[] = locale === "en" ? BASE_FIELDS : TRANSLATION_FIELDS;

  for (const [field, value] of Object.entries(patch)) {
    if (!allowed.includes(field)) {
      problems.push({
        field,
        message:
          locale === "en"
            ? "cannot be edited from the panel"
            : "is not translatable — edit it on the English record",
      });
      continue;
    }

    // `null` is a deliberate clear, not a missing value.
    if (value === null) {
      if (!isClearable(field)) {
        problems.push({ field, message: "cannot be left empty" });
      }
      continue;
    }

    if ((STRING_LISTS as readonly string[]).includes(field)) {
      checkStringList(field, value, problems);
      continue;
    }

    switch (field) {
      case "specs":
        checkSpecs(value, problems);
        break;
      case "seo":
        checkSeo(value, problems);
        break;
      case "faq":
        checkFaq(value, problems);
        break;
      case "nutritionLabels":
        checkNutritionLabels(value, problems);
        break;
      case "availability":
        if (!AVAILABILITY_VALUES.includes(value as Availability)) {
          problems.push({ field, message: `must be one of: ${AVAILABILITY_VALUES.join(", ")}` });
        }
        break;
      case "featured":
        if (typeof value !== "boolean") problems.push({ field, message: "must be true or false" });
        break;
      case "availableFrom":
      case "availableUntil":
        if (typeof value !== "string" || (value !== "" && !ISO_DATE.test(value))) {
          problems.push({ field, message: "must be a date as yyyy-mm-dd" });
        }
        break;
      default:
        checkText(field, value, problems);
    }
  }

  return problems;
}

/**
 * Remove anything a patch is not allowed to carry, and drop fields that
 * are empty so a blank form field means "leave the code default alone"
 * rather than "overwrite it with nothing".
 *
 * Validation reports; this enforces. Both run on every write — the
 * first so the editor sees why, the second so a malformed patch can
 * never reach the database even if the form is bypassed.
 */
export function sanitisePatch(
  patch: Record<string, unknown>,
  locale: string,
): Record<string, unknown> {
  const allowed: readonly string[] = locale === "en" ? BASE_FIELDS : TRANSLATION_FIELDS;
  const clean: Record<string, unknown> = {};

  for (const [field, value] of Object.entries(patch)) {
    if (!allowed.includes(field)) continue;

    if (value === null) {
      // Carried through so applyPatch can delete the field.
      if (isClearable(field)) clean[field] = null;
      continue;
    }

    if ((STRING_LISTS as readonly string[]).includes(field)) {
      if (!Array.isArray(value)) continue;
      const items = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      if (items.length) clean[field] = items;
      continue;
    }

    if (field === "specs" && typeof value === "object" && value !== null) {
      const specs: Record<string, Record<string, string>> = {};
      for (const [key, spec] of Object.entries(value as Record<string, unknown>)) {
        if (!(PRODUCT_SPEC_KEYS as string[]).includes(key)) continue;
        if (typeof spec !== "object" || spec === null) continue;
        const entry: Record<string, string> = {};
        for (const prop of ["label", "value", "note"] as const) {
          const propValue = (spec as Record<string, unknown>)[prop];
          if (typeof propValue === "string" && propValue.trim()) entry[prop] = propValue.trim();
        }
        if (Object.keys(entry).length) specs[key] = entry;
      }
      if (Object.keys(specs).length) clean.specs = specs;
      continue;
    }

    if (field === "seo" && typeof value === "object" && value !== null) {
      const seo: Record<string, string> = {};
      for (const prop of ["title", "description"] as const) {
        const propValue = (value as Record<string, unknown>)[prop];
        if (typeof propValue === "string" && propValue.trim()) seo[prop] = propValue.trim();
      }
      if (Object.keys(seo).length) clean.seo = seo;
      continue;
    }

    if (field === "faq" && Array.isArray(value)) {
      const entries = value
        .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null && !Array.isArray(e))
        .map((e) => ({
          question: typeof e.question === "string" ? e.question.trim() : "",
          answer: typeof e.answer === "string" ? e.answer.trim() : "",
        }))
        // A half-filled entry would render a question with no answer.
        .filter((e) => e.question && e.answer);
      if (entries.length) clean.faq = entries;
      continue;
    }

    if (field === "nutritionLabels" && typeof value === "object" && value !== null && !Array.isArray(value)) {
      const labels: Record<string, string> = {};
      for (const [key, label] of Object.entries(value as Record<string, unknown>)) {
        if (typeof label === "string" && label.trim()) labels[key] = label.trim();
      }
      if (Object.keys(labels).length) clean.nutritionLabels = labels;
      continue;
    }

    if (field === "featured") {
      if (typeof value === "boolean") clean.featured = value;
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) clean[field] = trimmed;
    }
  }

  return clean;
}

/* ------------------------------------------------------------------ */
/* Applying a patch                                                    */
/* ------------------------------------------------------------------ */

/**
 * Merge a spec row, preserving the `demo` rule.
 *
 * A spec keeps its `demo` flag unless the base layer supplies a new
 * `value`. That exception is the whole point of the editor: when
 * someone weighs a bale and types the real figure into the English
 * record, the placeholder marker should disappear on its own. A
 * translation never clears it — rewording a number in Kurdish does not
 * make it measured.
 */
function applySpec(
  base: Product[ProductSpecKey],
  patch: Partial<{ label: string; value: string; note: string }> | undefined,
  isBaseLayer: boolean,
): Product[ProductSpecKey] {
  if (!base) return base;
  if (!patch) return base;
  const replacesValue = isBaseLayer && typeof patch.value === "string" && patch.value !== base.value;
  return { ...base, ...patch, demo: replacesValue ? undefined : base.demo };
}

/**
 * Layer one stored patch onto a product. `locale === "en"` means the
 * base layer; anything else is treated as a translation.
 */
export function applyPatch(product: Product, patch: Record<string, unknown>, locale: string): Product {
  const isBaseLayer = locale === "en";
  const next: Product = { ...product };

  for (const [field, value] of Object.entries(patch)) {
    if (value === null) {
      // A deliberate clear: the product renders as if the committed
      // value were never there.
      delete (next as unknown as Record<string, unknown>)[field];
      continue;
    }
    if (field === "specs") {
      const specs = value as Partial<Record<ProductSpecKey, Partial<{ label: string; value: string; note: string }>>>;
      for (const key of PRODUCT_SPEC_KEYS) {
        const merged = applySpec(product[key], specs[key], isBaseLayer);
        if (merged) next[key] = merged;
      }
      continue;
    }
    if (field === "seo") {
      next.seo = { ...product.seo, ...(value as { title?: string; description?: string }) };
      continue;
    }
    if (field === "nutritionLabels") {
      /*
       * There is no `nutritionLabels` field on Product — the labels live
       * on each nutrition entry. Mirrors translateProduct in
       * data/dictionaries.ts. Assigning it generically would have set a
       * field nothing reads and silently lost every translated label.
       *
       * Only the LABEL is taken. The key and the measured number are
       * facts and stay exactly as committed.
       */
      if (product.nutrition) {
        const labels = value as Record<string, string>;
        next.nutrition = product.nutrition.map((n) => ({ ...n, label: labels[n.key] ?? n.label }));
      }
      continue;
    }
    // Every remaining allowed field maps one-for-one onto Product.
    (next as unknown as Record<string, unknown>)[field] = value;
  }

  return next;
}

/** A stored patch narrowed to the translation shape, for documentation. */
export type StoredTranslationPatch = ProductTranslation;
