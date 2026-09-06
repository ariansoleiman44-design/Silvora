import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PRODUCT_SPEC_KEYS } from "@/types/i18n";
import { products } from "@/data/products";
import { getDictionaryFor } from "@/data/dictionaries";
import { activeLocales, defaultLocale, getLocale, isActiveLocale } from "@/lib/i18n";
import { getOverride } from "@/lib/server/admin-data";
import { isSupabaseConfigured, safeRead } from "@/lib/server/supabase";
import { ProductEditor } from "./ProductEditor";
import { NoDatabase } from "../../ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: products.find((p) => p.slug === slug)?.name ?? slug };
}

/**
 * Locales whose translation has never been read by a native speaker.
 * The editor says so before someone edits one — the review documents
 * in docs/ assume translations live in files, and an edit made here
 * will not show up in them.
 */
const UNREVIEWED = new Set(["ar", "ckb", "kmr"]);

export default async function ProductEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug } = await params;
  const { locale: localeParam } = await searchParams;

  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const locale = isActiveLocale(localeParam ?? "") ? (localeParam as string) : defaultLocale;
  const isBase = locale === defaultLocale;

  /*
   * The baseline is what the code renders BEFORE any database patch:
   * data/products.ts for English, plus the file overlay for a
   * translation. The editor diffs against this, so a saved patch
   * contains only genuine differences and "reset" really does return to
   * what is committed.
   */
  const fromCode =
    getDictionaryFor(locale as never).products.find((p) => p.slug === slug) ?? product;

  const override = isSupabaseConfigured()
    ? await safeRead(() => getOverride(slug, locale), null, "admin/product")
    : null;

  const baseline: Record<string, unknown> = {
    name: fromCode.name,
    shortName: fromCode.shortName,
    category: fromCode.category,
    tagline: fromCode.tagline,
    shortDescription: fromCode.shortDescription,
    badge: fromCode.badge ?? "",
    availabilityNote: fromCode.availabilityNote ?? "",
    harvestSeason: fromCode.harvestSeason ?? "",
    availability: fromCode.availability,
    availableFrom: fromCode.availableFrom ?? "",
    availableUntil: fromCode.availableUntil ?? "",
    description: fromCode.description ?? [],
    features: fromCode.features ?? [],
    bestFor: fromCode.bestFor ?? [],
    storageGuidance: fromCode.storageGuidance ?? [],
    handling: fromCode.handling ?? [],
    deliveryNotes: fromCode.deliveryNotes ?? [],
    keywords: fromCode.keywords ?? [],
    seo: fromCode.seo ?? {},
    specs: Object.fromEntries(
      PRODUCT_SPEC_KEYS.map((key) => {
        const spec = fromCode[key];
        return [
          key,
          spec ? { label: spec.label, value: spec.value, note: spec.note ?? "" } : { label: "", value: "", note: "" },
        ];
      }),
    ),
  };

  return (
    <>
      <p className="admin-foot" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
        <Link href="/admin/products">← Products</Link>
      </p>

      <h1 className="admin-h1">{product.name}</h1>
      <p className="admin-sub admin-mono">{product.slug}</p>

      <nav className="locale-tabs">
        {activeLocales.map((code) => (
          <Link
            key={code}
            href={`/admin/products/${slug}?locale=${code}`}
            aria-current={code === locale ? "true" : undefined}
          >
            {getLocale(code).label}
          </Link>
        ))}
      </nav>

      {isBase ? (
        <div className="notice notice-warn">
          <p>
            <strong>This is the base record.</strong> Availability, dates and specification values
            saved here apply to <em>every</em> language — a bale&rsquo;s availability is a fact,
            not a translation.
          </p>
          <p>
            Typing a real measured figure into a specification value clears its{" "}
            <em>unverified</em> marker. Only do that for numbers that were actually measured.
          </p>
        </div>
      ) : (
        <div className="notice notice-warn">
          <p>
            <strong>Translation only.</strong> Availability, dates and machine fields are edited on
            the English record. Anything left blank here falls back to English.
          </p>
          {UNREVIEWED.has(locale) && (
            <p>
              No native speaker has reviewed this locale. Edits made here will not appear in{" "}
              <code>docs/{locale.toUpperCase()}-REVIEW.md</code>, which is generated from the files
              in <code>data/{locale}/</code>.
            </p>
          )}
        </div>
      )}

      {!isSupabaseConfigured() ? (
        <NoDatabase what="Saved edits" />
      ) : (
        <ProductEditor
          slug={slug}
          locale={locale}
          isBase={isBase}
          baseline={baseline}
          saved={(override?.patch ?? {}) as Record<string, unknown>}
        />
      )}
    </>
  );
}
