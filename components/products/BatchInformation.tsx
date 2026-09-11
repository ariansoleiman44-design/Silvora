import { FileText } from "lucide-react";
import { batchLabReport, batchNutritionRows, batchRows, visibleBatches } from "@/lib/spec-sheet";
import { externalLinkRel } from "@/lib/url-safety";
import { getCopy } from "@/lib/dictionary";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

/**
 * BATCH INFORMATION
 * --------------------------------------------------------------------
 * Harvest / packing records, ready for real data.
 *
 * Only populated fields render, and a product with no batches renders a
 * single honest line rather than an empty table. The structure supports
 * several batches per product, so a live catalogue can list this
 * season's and last season's records side by side.
 */
export function BatchInformation({
  product,
  className,
  tone = "light",
}: {
  product: Product;
  className?: string;
  tone?: "light" | "dark";
}) {
  const copy = getCopy();
  const t = copy.product;
  const batches = visibleBatches(product);
  const dark = tone === "dark";

  return (
    <section className={cn(className)}>
      <h4 className={cn("eyebrow", dark ? "text-cream" : "text-ink")}>{t.batchTitle}</h4>

      {batches.length === 0 ? (
        <p className={cn("mt-3 text-sm leading-relaxed", dark ? "text-cream/60" : "text-ink/60")}>
          {t.noBatch}
        </p>
      ) : (
        <ul className="mt-3 grid gap-4">
          {batches.map((batch) => (
            <li
              key={batch.code}
              className={cn("border p-4", dark ? "border-cream/12" : "border-ink/12")}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className={cn("eyebrow", dark ? "text-cream/60" : "text-ink/60")}>{t.batchCode}</p>
                <p className="mono-num font-display text-lg">
                  {batch.code}
                  {batch.demo && (
                    <span
                      className="ms-2 align-middle text-[0.5625rem] font-sans font-semibold uppercase tracking-[0.18em] text-gold"
                      title={copy.common.demoNote}
                    >
                      {copy.common.demoLabel}
                    </span>
                  )}
                </p>
              </div>
              <dl className="mt-2">
                {batchRows(batch).map((r) => (
                  <div
                    key={r.label}
                    className={cn(
                      "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b py-2 last:border-b-0",
                      dark ? "border-cream/10" : "border-ink/10",
                    )}
                  >
                    <dt className={cn("text-sm", dark ? "text-cream/60" : "text-ink/60")}>{r.label}</dt>
                    <dd className="text-sm font-medium">{r.value}</dd>
                  </div>
                ))}
              </dl>

              {/* Measured analysis for THIS batch only. Never presented
                  as a product-wide nutritional profile. */}
              {batchNutritionRows(batch).length > 0 && (
                <>
                  <p className={cn("eyebrow mt-4", dark ? "text-cream/60" : "text-ink/60")}>
                    {t.batchNutrition}
                  </p>
                  <dl className="mt-2">
                    {batchNutritionRows(batch).map((r) => (
                      <div
                        key={r.label}
                        className={cn(
                          "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b py-2 last:border-b-0",
                          dark ? "border-cream/10" : "border-ink/10",
                        )}
                      >
                        <dt className={cn("text-sm", dark ? "text-cream/60" : "text-ink/60")}>
                          {r.label}
                          {r.note && (
                            <span className={cn("ms-2 text-xs", dark ? "text-cream/40" : "text-ink/60")}>
                              {r.note}
                            </span>
                          )}
                        </dt>
                        <dd className="mono-num text-sm font-medium">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}

              {batchLabReport(batch) && (
                <a
                  href={batchLabReport(batch)!}
                  target="_blank"
                  rel={externalLinkRel}
                  className={cn(
                    "mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
                    dark ? "text-cream/70 hover:text-cream" : "text-ink/70 hover:text-ink",
                  )}
                >
                  <FileText className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  {t.viewLabReport}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
