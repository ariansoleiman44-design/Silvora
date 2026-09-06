import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Reveal, RevealGroup, RevealItem, RevealLines } from "@/components/ui/Reveal";
import { getCopy } from "@/lib/dictionary";
import { pad2 } from "@/lib/utils";

/**
 * Quality — big dark photography and six things a buyer should inspect.
 */
export function QualitySection() {
  const copy = getCopy();
  const t = copy.quality;
  return (
    <section id="quality" className="cv-auto grain relative overflow-hidden bg-ink text-cream">
      <div className="grid lg:grid-cols-12">
        <div className="relative lg:col-span-6 lg:min-h-[100svh]">
          <ImageFrame
            image="cornDark"
            className="aspect-[4/5] sm:aspect-[3/2] lg:absolute lg:inset-0 lg:aspect-auto"
            sizes="(min-width: 1024px) 50vw, 100vw"
            parallax={8}
            reveal={false}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-ink" aria-hidden />
        </div>

        <div className="relative z-10 px-[var(--gutter)] py-14 lg:col-span-6 lg:py-24 lg:ps-16">
          <Reveal>
            <Eyebrow className="mb-6">{t.eyebrow}</Eyebrow>
          </Reveal>
          <RevealLines lines={t.headline} className="display-md uppercase" />
          <Reveal delay={0.15}>
            <p className="body-lg mt-6 max-w-md text-cream/65">{t.intro}</p>
          </Reveal>

          <RevealGroup as="ol" className="mt-10 grid gap-x-8 border-t border-cream/12 sm:grid-cols-2">
            {t.checks.map((c, i) => (
              <RevealItem as="li" key={c.title} className="border-b border-cream/12 py-6">
                <p className="eyebrow text-gold">{pad2(i + 1)}</p>
                <h3 className="display-xs mt-3 uppercase">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/60">{c.text}</p>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.2} className="mt-10">
            <Button href="/quality" variant="outline-light">
              {t.cta}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
