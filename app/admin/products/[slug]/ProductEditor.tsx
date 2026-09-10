"use client";

import { useActionState } from "react";
import { AVAILABILITY_VALUES } from "@/lib/product-schema";
import { resetProduct, saveProduct, type EditorState } from "../actions";

/**
 * The product form.
 *
 * A client component only because it needs the validation problems and
 * the pending flag back from the action. Everything it renders comes
 * from the server as props — it imports no product data of its own, so
 * the catalogue does not follow it into the browser bundle.
 */

interface Props {
  slug: string;
  locale: string;
  isBase: boolean;
  /** What the committed code renders today. */
  baseline: Record<string, unknown>;
  /** The patch already stored for this slug and locale, if any. */
  saved: Record<string, unknown>;
}

const SINGLE_LABELS: Record<string, string> = {
  name: "Name",
  shortName: "Short name",
  category: "Category",
  tagline: "Tagline",
  shortDescription: "Short description",
  badge: "Badge",
  availabilityNote: "Availability note",
  harvestSeason: "Harvest season",
};

const LIST_LABELS: Record<string, string> = {
  description: "Description paragraphs",
  features: "Features",
  bestFor: "Best for",
  storageGuidance: "Storage guidance",
  handling: "Handling",
  deliveryNotes: "Delivery notes",
  keywords: "Search keywords",
};

/** Stored patch value if present, otherwise what the code renders. */
function initial(saved: Record<string, unknown>, baseline: Record<string, unknown>, field: string): string {
  const value = field in saved ? saved[field] : baseline[field];
  return typeof value === "string" ? value : "";
}

function initialList(saved: Record<string, unknown>, baseline: Record<string, unknown>, field: string): string {
  const value = field in saved ? saved[field] : baseline[field];
  return Array.isArray(value) ? value.join("\n") : "";
}

function initialSpec(
  saved: Record<string, unknown>,
  baseline: Record<string, unknown>,
  key: string,
  prop: string,
): string {
  const savedSpecs = (saved.specs ?? {}) as Record<string, Record<string, string>>;
  const baseSpecs = (baseline.specs ?? {}) as Record<string, Record<string, string>>;
  return savedSpecs[key]?.[prop] ?? baseSpecs[key]?.[prop] ?? "";
}

function initialSeo(saved: Record<string, unknown>, baseline: Record<string, unknown>, prop: string): string {
  const savedSeo = (saved.seo ?? {}) as Record<string, string>;
  const baseSeo = (baseline.seo ?? {}) as Record<string, string>;
  return savedSeo[prop] ?? baseSeo[prop] ?? "";
}

export function ProductEditor({ slug, locale, isBase, baseline, saved }: Props) {
  const [state, action, pending] = useActionState<EditorState, FormData>(saveProduct, {});

  /*
   * Matched by prefix, not by exact name. A problem on a list item is
   * reported as "features[2]" and one on a spec label as
   * "specs.weight.label", so exact matching left them attached to
   * nothing — the banner said "Fix the fields marked below" with
   * nothing marked, and no way to discover which value was rejected.
   */
  const problemsFor = (field: string) =>
    (state.problems ?? []).filter(
      (p) => p.field === field || p.field.startsWith(`${field}[`) || p.field.startsWith(`${field}.`),
    );
  const problemFor = (field: string) => problemsFor(field)[0]?.message;

  /*
   * Anything the form has no input for. Rendered in the banner so a
   * problem can never be invisible, whatever new field is added later.
   */
  const shownFields = new Set<string>([
    ...(isBase
      ? ["name", "shortName", "category", "tagline", "shortDescription", "badge", "availabilityNote", "harvestSeason", "availability", "availableFrom", "availableUntil"]
      : ["name", "shortName", "category", "tagline", "shortDescription", "badge", "availabilityNote"]),
    ...(isBase
      ? ["description", "features", "bestFor", "storageGuidance", "handling", "deliveryNotes", "keywords"]
      : ["description", "features", "bestFor", "storageGuidance", "handling"]),
    "specs",
    "seo",
  ]);
  const orphanProblems = (state.problems ?? []).filter(
    (p) => !shownFields.has(p.field.split(/[.[]/)[0] ?? ""),
  );

  const hasOverride = Object.keys(saved).length > 0;

  const singles = isBase
    ? ["name", "shortName", "category", "tagline", "shortDescription", "badge", "availabilityNote", "harvestSeason"]
    : ["name", "shortName", "category", "tagline", "shortDescription", "badge", "availabilityNote"];

  const lists = isBase
    ? ["description", "features", "bestFor", "storageGuidance", "handling", "deliveryNotes", "keywords"]
    : ["description", "features", "bestFor", "storageGuidance", "handling"];

  return (
    <>
      {state.saved && (
        <div className="notice notice-ok" role="status">
          <p>Saved and published. The public pages have been refreshed.</p>
        </div>
      )}
      {state.error && (
        <div className="notice notice-error" role="alert">
          <p>{state.error}</p>
        </div>
      )}
      {state.problems && state.problems.length > 0 && (
        <div className="notice notice-error" role="alert">
          <p>
            <strong>Nothing was saved.</strong> Fix the fields marked below.
          </p>
          {orphanProblems.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingInlineStart: 18 }}>
              {orphanProblems.map((p) => (
                <li key={`${p.field}-${p.message}`} className="admin-mono" style={{ fontSize: 12 }}>
                  {p.field} {p.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form action={action}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="locale" value={locale} />
        {/*
          What the code renders, sent back so the action diffs against
          exactly what this form was populated from. Without it a patch
          could be computed against a catalogue that changed underneath.
        */}
        <input type="hidden" name="baseline" value={JSON.stringify(baseline)} />

        <div className="admin-card">
          <h2 className="admin-h2" style={{ marginTop: 0 }}>
            Text
          </h2>
          {singles.map((field) => (
            <label className="admin-field" key={field}>
              <span>{SINGLE_LABELS[field]}</span>
              <input type="text" name={field} defaultValue={initial(saved, baseline, field)} />
              {problemFor(field) && <span className="field-error">{problemFor(field)}</span>}
            </label>
          ))}
        </div>

        {isBase && (
          <div className="admin-card" style={{ marginTop: 16 }}>
            <h2 className="admin-h2" style={{ marginTop: 0 }}>
              Supply
            </h2>
            <label className="admin-field">
              <span>Availability — applies to every language</span>
              <select name="availability" defaultValue={initial(saved, baseline, "availability")}>
                {AVAILABILITY_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              {problemFor("availability") && (
                <span className="field-error">{problemFor("availability")}</span>
              )}
            </label>
            <label className="admin-field">
              <span>Available from</span>
              <input type="date" name="availableFrom" defaultValue={initial(saved, baseline, "availableFrom")} />
              {problemFor("availableFrom") && (
                <span className="field-error">{problemFor("availableFrom")}</span>
              )}
            </label>
            <label className="admin-field">
              <span>Available until</span>
              <input type="date" name="availableUntil" defaultValue={initial(saved, baseline, "availableUntil")} />
              {problemFor("availableUntil") && (
                <span className="field-error">{problemFor("availableUntil")}</span>
              )}
            </label>
          </div>
        )}

        <div className="admin-card" style={{ marginTop: 16 }}>
          <h2 className="admin-h2" style={{ marginTop: 0 }}>
            Lists
          </h2>
          <p className="admin-sub">One item per line. An empty line is ignored.</p>
          {lists.map((field) => (
            <label className="admin-field" key={field}>
              <span>{LIST_LABELS[field]}</span>
              <textarea name={field} defaultValue={initialList(saved, baseline, field)} rows={4} />
              {problemFor(field) && <span className="field-error">{problemFor(field)}</span>}
            </label>
          ))}
        </div>

        <div className="admin-card" style={{ marginTop: 16 }}>
          <h2 className="admin-h2" style={{ marginTop: 0 }}>
            Specification rows
          </h2>
          <p className="admin-sub">
            {isBase
              ? "Changing a value here clears its unverified marker. Only enter figures that were actually measured."
              : "Translate the label and, where it is prose rather than a number, the value."}
          </p>
          {/*
            Driven by the baseline, not by every possible key: a row the
            product does not define cannot be saved, so it is not shown.
          */}
          {Object.keys((baseline.specs ?? {}) as Record<string, unknown>).map((key) => (
            <fieldset
              key={key}
              style={{ border: "1px solid var(--line-soft)", borderRadius: 6, padding: 12, marginBottom: 12 }}
            >
              <legend className="admin-mono" style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {key}
              </legend>
              <label className="admin-field">
                <span>Label</span>
                <input type="text" name={`spec.${key}.label`} defaultValue={initialSpec(saved, baseline, key, "label")} />
                {problemFor(`specs.${key}.label`) && (
                  <span className="field-error">{problemFor(`specs.${key}.label`)}</span>
                )}
              </label>
              <label className="admin-field">
                <span>Value</span>
                <input type="text" name={`spec.${key}.value`} defaultValue={initialSpec(saved, baseline, key, "value")} />
                {problemFor(`specs.${key}.value`) && (
                  <span className="field-error">{problemFor(`specs.${key}.value`)}</span>
                )}
              </label>
              <label className="admin-field" style={{ marginBottom: 0 }}>
                <span>Note</span>
                <input type="text" name={`spec.${key}.note`} defaultValue={initialSpec(saved, baseline, key, "note")} />
                {problemFor(`specs.${key}.note`) && (
                  <span className="field-error">{problemFor(`specs.${key}.note`)}</span>
                )}
              </label>
            </fieldset>
          ))}
        </div>

        <div className="admin-card" style={{ marginTop: 16 }}>
          <h2 className="admin-h2" style={{ marginTop: 0 }}>
            Search listing
          </h2>
          <label className="admin-field">
            <span>Title</span>
            <input type="text" name="seo.title" defaultValue={initialSeo(saved, baseline, "title")} />
            {problemFor("seo.title") && <span className="field-error">{problemFor("seo.title")}</span>}
          </label>
          <label className="admin-field" style={{ marginBottom: 0 }}>
            <span>Description</span>
            <textarea name="seo.description" defaultValue={initialSeo(saved, baseline, "description")} rows={3} />
            {problemFor("seo.description") && (
              <span className="field-error">{problemFor("seo.description")}</span>
            )}
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
          <button type="submit" className="admin-btn" disabled={pending}>
            {pending ? "Publishing…" : "Save and publish"}
          </button>
          <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>
            {hasOverride
              ? "This record has saved edits layered over the code."
              : "This record is unedited — it renders straight from the code."}
          </span>
        </div>
      </form>

      {hasOverride && (
        /*
         * Outside the form above: a nested form is invalid HTML, and
         * reset is a different operation with a different consequence.
         */
        <form action={resetProduct} style={{ marginTop: 20 }}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="admin-btn admin-btn-danger">
            Discard edits and revert to the committed version
          </button>
        </form>
      )}
    </>
  );
}
