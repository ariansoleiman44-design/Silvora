import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { getDictionary } from "@/lib/dictionary";
import { getCopy } from "@/lib/dictionary";

/**
 * Format comparison: a hairline table on desktop, snap-scrolling cards
 * on mobile. Pure CSS — no JS needed for the responsive switch.
 */
export function Comparison() {
  const copy = getCopy();
  const { columns: comparisonColumns, rows: comparisonRows } = getDictionary().comparison;
  const t = copy.comparison;
  return (
    <section id="compare" className="cv-auto section-y scroll-mt-28 bg-cream text-ink">
      <div className="container-x">
        <SectionHeader eyebrow={t.eyebrow} lines={t.headline} intro={t.intro} />
      </div>

      {/* Desktop table */}
      <Reveal className="container-x mt-14 hidden md:block" y={20}>
        <table className="w-full border-collapse text-start">
          <caption className="sr-only">{t.eyebrow}</caption>
          <thead>
            <tr className="border-b border-ink/15">
              <th scope="col" className="eyebrow py-5 text-start text-ink/60">
                {t.rowLabel}
              </th>
              {comparisonColumns.map((col) => (
                <th key={col.key} scope="col" className="py-5 text-start">
                  <Link href={`/products/${col.productSlug}`} className="group inline-flex items-center gap-2 font-display text-2xl">
                    {col.label}
                    <ArrowUpRight className="h-4 w-4 text-ink/65 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 group-hover:text-ink" strokeWidth={1.5} aria-hidden />
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row) => (
              <tr key={row.label} className="border-b border-ink/10 transition-colors hover:bg-ink/[0.03]">
                <th scope="row" className="py-5 pe-6 text-start text-sm font-medium text-ink/70">
                  {row.label}
                </th>
                {comparisonColumns.map((col) => (
                  <td key={col.key} className="py-5 pe-6 align-top text-sm leading-relaxed text-ink/85">
                    {row.values[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      {/* Mobile cards */}
      <ul className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] scroll-ps-[var(--gutter)] pb-2 md:hidden" aria-label={t.eyebrow}>
        {comparisonColumns.map((col) => (
          <li key={col.key} className="w-[82vw] max-w-[22rem] shrink-0 snap-center border border-ink/12 bg-white/40 p-6">
            <div className="flex items-baseline justify-between border-b border-ink/12 pb-4">
              <h3 className="font-display text-3xl">{col.label}</h3>
              <Link href={`/products/${col.productSlug}`} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.15em] text-ink/60">
                {t.cta}
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              </Link>
            </div>
            <dl className="divide-y divide-ink/10">
              {comparisonRows.map((row) => (
                <div key={row.label} className="py-3.5">
                  <dt className="eyebrow text-ink/60">{row.label}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed">{row.values[col.key]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
        <li aria-hidden className="w-px shrink-0" />
      </ul>
    </section>
  );
}
