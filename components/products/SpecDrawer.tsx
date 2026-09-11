"use client";

import { useRouter } from "next/navigation";
import { Download, FlaskConical } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { AvailabilityBadge } from "@/components/products/AvailabilityBadge";
import { BatchInformation } from "@/components/products/BatchInformation";
import { buildSpecSections, hasLabReport, productDownloads } from "@/lib/spec-sheet";
import { externalLinkRel } from "@/lib/url-safety";
import { useQuote } from "@/lib/quote-store";
import { track } from "@/lib/analytics";
import { useCopy, useLocalePath } from "@/lib/locale-client";
import type { Product } from "@/types/product";

/**
 * Full specification, in a drawer rather than another page: a buyer
 * comparing formats should never lose their place.
 *
 * Two rules hold here. Nothing is invented — sections with no data are
 * absent, not empty. And every download exists: buttons are rendered
 * from configured URLs only, so there are no broken links. When no lab
 * report is configured, the ask becomes "request lab data" instead.
 */
export function SpecDrawer({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const copy = useCopy();
  const t = copy.product;
  const q = useQuote();
  const router = useRouter();
  // /quote must keep the visitor in their language — a bare push
  // sent Arabic and Kurdish buyers into the English wizard.
  const withLocale = useLocalePath();
  const sections = buildSpecSections(product);
  const downloads = productDownloads(product);

  const requestBatchData = () => {
    q.addProduct(product, 1, { open: false });
    q.patchRequirements({ labDataRequested: true });
    track("spec_request", { product: product.slug });
    onClose();
    router.push(withLocale("/quote"));
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t.specTitle}
      widthClassName="md:max-w-[34rem]"
      footer={
        <div className="space-y-3">
          <Button variant="ink" full icon="arrow" onClick={requestBatchData}>
            {hasLabReport(product) ? t.requestBatch : t.requestLab}
          </Button>
          <p className="text-xs leading-relaxed text-ink/55">{t.requestBatchNote}</p>
        </div>
      }
    >
      <div className="pb-2">
        <p className="eyebrow text-ink/55">{product.category}</p>
        <h3 className="display-xs mt-2">{product.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink/65">{t.specIntro}</p>
        <p className="mt-4 text-sm">
          <AvailabilityBadge product={product} tone="light" />
        </p>

        {downloads.length > 0 && (
          <ul className="mt-6 grid gap-2">
            {downloads.map((d) => (
              <li key={d.key}>
                {/* Opens in a new tab so a half-filled request is never
                    replaced by a PDF. Download is not forced — the
                    browser decides how to handle the file. */}
                <a
                  href={d.href}
                  target="_blank"
                  rel={d.external ? externalLinkRel : undefined}
                  className="inline-flex min-h-12 w-full items-center gap-3 rounded-[2px] border border-ink/20 px-4 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:border-ink/60 hover:bg-ink/5"
                >
                  <Download className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
                  <span className="flex-1 text-start">{d.label}</span>
                  {d.hint && (
                    <span className="shrink-0 font-normal tracking-normal text-ink/45 normal-case">
                      {d.hint}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}

        {sections.map((section) => (
          <section key={section.key} className="mt-8 border-t border-ink/12 pt-5">
            <h4 className="eyebrow text-ink">{section.title}</h4>

            {section.rows && (
              <dl className="mt-3">
                {section.rows.map((r) => (
                  <div
                    key={r.label}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/10 py-2.5 last:border-b-0"
                  >
                    <dt className="text-sm text-ink/55">{r.label}</dt>
                    <dd className="text-end text-sm font-medium">
                      {r.value}
                      {r.demo && (
                        <span
                          className="ms-2 align-middle text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-gold"
                          title={copy.common.demoNote}
                        >
                          {copy.common.demoLabel}
                        </span>
                      )}
                      {r.note && <span className="mt-0.5 block text-xs font-normal text-ink/55">{r.note}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {section.bullets && (
              <ul className="mt-3 space-y-2">
                {section.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-sm leading-relaxed text-ink/70">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <BatchInformation product={product} className="mt-8" />

        {!hasLabReport(product) && (
          <p className="mt-8 flex gap-3 border border-ink/12 bg-cream-deep p-4 text-xs leading-relaxed text-ink/65">
            <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
            <span>{copy.product.nutritionNote}</span>
          </p>
        )}
      </div>
    </Drawer>
  );
}
