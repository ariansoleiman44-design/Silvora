import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqsByCategory, type Faq } from "@/data/faqs";
import { getDictionary } from "@/lib/dictionary";
import { getCopy } from "@/lib/dictionary";
import { faqJsonLd } from "@/lib/seo";
import { pad2 } from "@/lib/utils";

export function FAQSection({ items, withSchema = true }: { items?: Faq[]; withSchema?: boolean }) {
  const copy = getCopy();
  // Resolved here, not as a default argument: the dictionary is
  // per-request and a default is evaluated at module scope.
  const faqs = items ?? getDictionary().faqs;
  const t = copy.faq;
  return (
    <section id="faq" className="cv-auto section-y bg-cream text-ink">
      {withSchema && <JsonLd data={faqJsonLd(faqs)} />}
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <Eyebrow className="mb-6">{t.eyebrow}</Eyebrow>
            </Reveal>
            <RevealLines lines={t.headline} className="display-lg uppercase" />
            <Reveal delay={0.15}>
              <p className="body-lg mt-6 max-w-sm text-ink/65">{t.intro}</p>
            </Reveal>
            <Reveal delay={0.2} className="mt-10 hidden lg:block">
              <p className="eyebrow text-ink/60">{t.more}</p>
              <Button href="/contact" variant="link-dark" className="mt-3">
                {t.moreCta}
              </Button>
            </Reveal>
          </div>
        </div>
        {/* Grouped by procurement topic. Server-rendered — the grouping
            adds no JavaScript, and every group has content by
            construction (empty categories are dropped). */}
        <div className="lg:col-span-8">
          {faqsByCategory(faqs, getDictionary().labels.faqCategory).map((group, gi) => (
            <Reveal key={group.category} y={20} className={gi === 0 ? "" : "mt-12"}>
              <h3 className="eyebrow mb-4 text-gold">{group.label}</h3>
              <Accordion
                items={group.items.map((f, i) => ({
                  index: pad2(i + 1),
                  title: f.question,
                  content: f.answer,
                }))}
                defaultOpen={gi === 0 ? [0] : []}
              />
            </Reveal>
          ))}
          <Reveal className="mt-8 lg:hidden">
            <p className="eyebrow text-ink/60">{t.more}</p>
            <Button href="/contact" variant="link-dark" className="mt-3">
              {t.moreCta}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
