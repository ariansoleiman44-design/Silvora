"use server";

import { revalidatePath, updateTag } from "next/cache";
import { PRODUCT_SPEC_KEYS } from "@/types/i18n";
import { activeLocales, defaultLocale } from "@/lib/i18n";
import { products } from "@/data/products";
import { sanitisePatch, validatePatch, type PatchProblem } from "@/lib/product-schema";
import { deleteOverride, getOverride, recordAudit } from "@/lib/server/admin-data";
import { OVERRIDES_TAG } from "@/lib/server/product-overrides";
import { upsertRows } from "@/lib/server/supabase";
import { requireAdmin } from "@/lib/server/admin-guard";

export interface EditorState {
  problems?: PatchProblem[];
  error?: string;
  saved?: boolean;
}

/** Lists are entered one item per line. Blank lines are dropped. */
function parseLines(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Build a patch from the form, keeping ONLY fields that differ from the
 * value the code already produces.
 *
 * This is what keeps the overlay honest. If the editor stored every
 * field it rendered, the database would immediately hold a full copy of
 * the catalogue, the "reset to code default" button would be
 * meaningless, and a later edit to data/products.ts would be silently
 * masked by a stale row nobody remembers writing.
 */
function buildPatch(formData: FormData, base: Record<string, unknown>, isBase: boolean): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  const singles = isBase
    ? ["name", "shortName", "category", "tagline", "shortDescription", "badge", "availabilityNote", "harvestSeason"]
    : ["name", "shortName", "category", "tagline", "shortDescription", "badge", "availabilityNote"];

  for (const field of singles) {
    if (!formData.has(field)) continue;
    const value = text(formData.get(field));
    if (value !== String(base[field] ?? "")) patch[field] = value;
  }

  const lists = isBase
    ? ["description", "features", "bestFor", "storageGuidance", "handling", "deliveryNotes", "keywords"]
    : ["description", "features", "bestFor", "storageGuidance", "handling"];

  for (const field of lists) {
    if (!formData.has(field)) continue;
    const value = parseLines(formData.get(field));
    const current = Array.isArray(base[field]) ? (base[field] as string[]) : [];
    if (JSON.stringify(value) !== JSON.stringify(current)) patch[field] = value;
  }

  if (isBase) {
    const availability = text(formData.get("availability"));
    if (availability && availability !== base.availability) patch.availability = availability;

    for (const field of ["availableFrom", "availableUntil"] as const) {
      if (!formData.has(field)) continue;
      const value = text(formData.get(field));
      if (value !== String(base[field] ?? "")) patch[field] = value;
    }
  }

  // Specification rows: label, value and note per row.
  const baseSpecs = (base.specs ?? {}) as Record<string, Record<string, string>>;
  const specs: Record<string, Record<string, string>> = {};
  for (const key of PRODUCT_SPEC_KEYS) {
    const entry: Record<string, string> = {};
    for (const prop of ["label", "value", "note"] as const) {
      const formKey = `spec.${key}.${prop}`;
      if (!formData.has(formKey)) continue;
      const value = text(formData.get(formKey));
      if (value !== String(baseSpecs[key]?.[prop] ?? "")) entry[prop] = value;
    }
    if (Object.keys(entry).length) specs[key] = entry;
  }
  if (Object.keys(specs).length) patch.specs = specs;

  const seo: Record<string, string> = {};
  const baseSeo = (base.seo ?? {}) as Record<string, string>;
  for (const prop of ["title", "description"] as const) {
    const formKey = `seo.${prop}`;
    if (!formData.has(formKey)) continue;
    const value = text(formData.get(formKey));
    if (value !== String(baseSeo[prop] ?? "")) seo[prop] = value;
  }
  if (Object.keys(seo).length) patch.seo = seo;

  return patch;
}

export async function saveProduct(_prev: EditorState, formData: FormData): Promise<EditorState> {
  await requireAdmin();
  const slug = text(formData.get("slug"));
  const locale = text(formData.get("locale")) || defaultLocale;

  if (!products.some((p) => p.slug === slug)) {
    return { error: "That product does not exist in the catalogue." };
  }
  if (!(activeLocales as string[]).includes(locale)) {
    return { error: "That is not an active locale." };
  }

  // The values the code currently renders, sent along by the form so
  // the diff is taken against exactly what the editor was shown.
  let baseline: Record<string, unknown> = {};
  try {
    baseline = JSON.parse(text(formData.get("baseline")) || "{}") as Record<string, unknown>;
  } catch {
    return { error: "The form state was malformed. Reload the page and try again." };
  }

  const patch = buildPatch(formData, baseline, locale === defaultLocale);

  // Nothing differs from the code — that is a reset, not an empty save.
  if (Object.keys(patch).length === 0) {
    const existing = await getOverride(slug, locale);
    if (existing) {
      await deleteOverride(slug, locale);
      await recordAudit({
        action: "product.reset",
        target: `${slug}:${locale}`,
        before: existing.patch,
      });
      updateTag(OVERRIDES_TAG);
      revalidatePath(`/admin/products/${slug}`);
    }
    return { saved: true };
  }

  const problems = validatePatch(patch, locale);
  if (problems.length) return { problems };

  // Validation reports; sanitise enforces. Both run — see product-schema.ts.
  const clean = sanitisePatch(patch, locale);

  const before = await getOverride(slug, locale);
  try {
    await upsertRows(
      "product_overrides",
      [{ slug, locale, patch: clean, updated_at: new Date().toISOString() }],
      "slug,locale",
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "The save failed." };
  }

  await recordAudit({
    action: "product.publish",
    target: `${slug}:${locale}`,
    before: before?.patch ?? null,
    after: clean,
  });

  // What makes the edit visible on the public site: product pages are
  // cached under this tag. `updateTag` rather than `revalidateTag`
  // because Next 16 gives the former read-your-own-writes semantics
  // inside a server action — the editor must see the change on the
  // very next render, not on the one after it.
  updateTag(OVERRIDES_TAG);
  revalidatePath(`/admin/products/${slug}`);
  revalidatePath("/admin/products");

  return { saved: true };
}

export async function resetProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const slug = text(formData.get("slug"));
  const locale = text(formData.get("locale")) || defaultLocale;
  if (!slug || !(activeLocales as string[]).includes(locale)) return;

  const existing = await getOverride(slug, locale);
  if (!existing) return;

  await deleteOverride(slug, locale);
  await recordAudit({ action: "product.reset", target: `${slug}:${locale}`, before: existing.patch });

  updateTag(OVERRIDES_TAG);
  revalidatePath(`/admin/products/${slug}`);
  revalidatePath("/admin/products");
}
