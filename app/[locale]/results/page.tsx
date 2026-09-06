import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { QuoteCTA } from "@/components/home/QuoteCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { publishedCaseStudies } from "@/data/case-studies";
import { getProduct } from "@/data/products";
import { media } from "@/data/media";
import { isActiveLocale } from "@/lib/i18n";
import { setRequestLocale } from "@/lib/locale-server";
import { getCopy } from "@/lib/dictionary";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { pad2 } from "@/lib/utils";

/**
 * RESULTS — customer case studies.
 *
 * The route exists so the system is ready, but it 404s while there is
 * nothing real to publish, and it is deliberately absent from the
 * navigation and the sitemap until then. An empty "success stories" page
 * is worse than no page.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const active = isActiveLocale(locale) ? locale : "en";
  const meta = getCopy(active).pageMeta.results;
  return buildMetadata({
    title: meta.title,
    description: meta.description,
    path: "/results",
    locale: active,
  });
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Publishes the locale for every server component below this
  // point. Next renders route segments independently, so the
  // layout setting it is not enough — each page must too.
  setRequestLocale(locale);
  const cases = publishedCaseStudies();
  if (cases.length === 0) notFound();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Results", path: "/results" }])} />
      <PageHero
        eyebrow="Results"
        lines={["Fed, measured,", "repeated."]}
        intro="Real operations, real supply plans, real outcomes. Published with the customer's permission."
        image="dairyBarn"
        size="md"
      />

      <section className="section-y bg-cream text-ink">
        <div className="container-x">
          <RevealGroup as="ol" className="grid gap-px border border-ink/12 bg-ink/12 lg:grid-cols-2">
            {cases.map((c, i) => {
              const img = c.image ? media[c.image] : undefined;
              return (
                <RevealItem as="li" key={c.slug} className="bg-cream p-6 md:p-9">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="eyebrow text-gold">{pad2(i + 1)}</p>
                    <p className="eyebrow text-ink/55">{c.location}</p>
                  </div>

                  {img && (
                    <div className="graded relative mt-6 aspect-[16/9] overflow-hidden bg-stone">
                      <Image src={img.src} alt={img.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
                    </div>
                  )}

                  <h2 className="display-sm mt-6">{c.operation}</h2>
                  <p className="mt-2 text-sm uppercase tracking-[0.14em] text-ink/55">{c.herdSize}</p>

                  <dl className="mt-6 border-t border-ink/12">
                    <div className="border-b border-ink/12 py-4">
                      <dt className="eyebrow text-ink/55">Challenge</dt>
                      <dd className="mt-2 text-sm leading-relaxed text-ink/75">{c.challenge}</dd>
                    </div>
                    <div className="border-b border-ink/12 py-4">
                      <dt className="eyebrow text-ink/55">Supply</dt>
                      <dd className="mt-2 text-sm leading-relaxed text-ink/75">{c.solution}</dd>
                    </div>
                    <div className="border-b border-ink/12 py-4">
                      <dt className="eyebrow text-ink/55">Outcome</dt>
                      <dd className="mt-2 text-sm leading-relaxed text-ink/75">{c.outcome}</dd>
                    </div>
                  </dl>

                  {c.metrics && c.metrics.length > 0 && (
                    <dl className="mt-6 grid grid-cols-2 gap-6">
                      {c.metrics.map((m) => (
                        <div key={m.label}>
                          <dt className="eyebrow text-ink/55">{m.label}</dt>
                          <dd className="mono-num mt-1 font-display text-3xl">{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {c.productsUsed.length > 0 && (
                    <p className="mt-6 text-xs uppercase tracking-[0.14em] text-ink/55">
                      {c.productsUsed
                        .map((slug) => getProduct(slug)?.name ?? slug)
                        .join(" · ")}
                    </p>
                  )}
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      <QuoteCTA />
    </>
  );
}
