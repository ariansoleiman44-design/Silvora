import { MapPin, Truck, Container, Boxes } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { siteConfig } from "@/data/site-config";
import { getCopy } from "@/lib/dictionary";
import { pad2 } from "@/lib/utils";

const icons = [MapPin, Truck, Container, Boxes];

/**
 * Logistics — four service modes and the (configurable) service areas.
 */
export function LogisticsSection() {
  const copy = getCopy();
  const t = copy.logistics;
  const areas = siteConfig.serviceAreas;

  return (
    <section id="logistics" className="cv-auto section-y bg-cream-deep text-ink">
      <div className="container-x">
        <SectionHeader eyebrow={t.eyebrow} lines={t.headline} intro={t.intro} size="md" />

        <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-8">
          <ImageFrame
            image="balesTurbines"
            className="aspect-[4/3] lg:col-span-5 lg:aspect-auto lg:min-h-[32rem]"
            sizes="(min-width: 1024px) 40vw, 100vw"
            parallax={6}
          />

          <div className="lg:col-span-7">
            <RevealGroup as="ul" className="grid gap-px border border-ink/12 bg-ink/12 sm:grid-cols-2">
              {t.services.map((s, i) => {
                const Icon = icons[i] ?? Truck;
                return (
                  <RevealItem as="li" key={s.title} className="bg-cream-deep p-6 md:p-8">
                    <div className="flex items-center justify-between">
                      <Icon className="h-5 w-5 text-leaf" strokeWidth={1.25} aria-hidden />
                      <span className="eyebrow text-ink/60">{pad2(i + 1)}</span>
                    </div>
                    <h3 className="display-xs mt-6">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">{s.text}</p>
                  </RevealItem>
                );
              })}
            </RevealGroup>

            <Reveal delay={0.2} className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow text-ink/60">{t.areasTitle}</p>
                {areas.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {areas.map((a) => (
                      <li key={a.name} className="rounded-full border border-ink/20 px-3 py-1.5 text-xs">
                        {a.name}
                        {a.note && <span className="text-ink/60"> · {a.note}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 max-w-md text-sm text-ink/65">{t.areasEmpty}</p>
                )}
              </div>
              <Button href="/logistics" variant="outline-dark">
                {t.cta}
              </Button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
