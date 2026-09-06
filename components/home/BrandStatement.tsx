import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { getCopy } from "@/lib/dictionary";

/**
 * Editorial statement: oversized serif headline, two short paragraphs
 * and an asymmetric pair of crop photographs.
 */
export function BrandStatement() {
  const copy = getCopy();
  const t = copy.statement;
  return (
    <section className="cv-auto section-y overflow-hidden bg-cream-deep text-ink">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Text */}
          <div className="lg:col-span-5 lg:pt-10">
            <Reveal>
              <Eyebrow className="mb-8">{t.eyebrow}</Eyebrow>
            </Reveal>
            <RevealLines lines={t.headline} className="display-lg uppercase" />
            <div className="mt-10 max-w-md space-y-5">
              {t.paragraphs.map((p, i) => (
                <Reveal key={i} delay={0.1 + i * 0.1}>
                  <p className="body-lg text-ink/70">{p}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.3} className="mt-10">
              <Button href="/process" variant="link-dark">
                {t.cta}
              </Button>
            </Reveal>
          </div>

          {/* Images */}
          <div className="relative lg:col-span-7">
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <ImageFrame
                image="cornPlant"
                className="col-span-12 aspect-[4/3] sm:col-span-8 sm:col-start-5 lg:col-span-9 lg:col-start-4"
                sizes="(min-width: 1024px) 45vw, (min-width: 640px) 60vw, 100vw"
                parallax={6}
              />
              <figure className="col-span-7 -mt-16 sm:col-span-5 sm:col-start-1 sm:-mt-32 lg:col-span-5 lg:-mt-40">
                <ImageFrame
                  image="seedling"
                  className="aspect-[4/5] shadow-2xl shadow-ink/20"
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 35vw, 55vw"
                />
                <figcaption className="mt-3 flex items-center gap-3">
                  <span aria-hidden className="h-px w-6 bg-ink/40" />
                  <span className="eyebrow text-ink/60">{t.caption}</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
