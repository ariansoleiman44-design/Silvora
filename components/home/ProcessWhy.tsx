import { Button } from "@/components/ui/Button";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { getDictionary } from "@/lib/dictionary";

import { getCopy } from "@/lib/dictionary";
import { pad2 } from "@/lib/utils";

/**
 * PROCESS & PRINCIPLES — the homepage's single long-form chapter.
 *
 * One argument told in two movements rather than two stacked sections:
 *
 *   I. The sequence  — the eight steps, stated plainly and quickly.
 *   II. The decisions — what we choose to do inside those steps.
 *
 * Both movements share one headline, one chapter rule, one numbering
 * system and one image rhythm (portrait left, list right → list left,
 * portrait right), so the reader experiences it as a single spread.
 *
 * The photographic, scroll-driven version of the sequence still lives on
 * /process (<FieldToFeed />); this is the condensed homepage telling.
 */

function ChapterRule({ numeral, title, note }: { numeral: string; title: string; note: string }) {
  return (
    <Reveal className="flex flex-col gap-4 border-t border-ink/20 pt-5 sm:flex-row sm:items-baseline sm:gap-8" y={16}>
      <span className="font-display text-2xl leading-none text-gold" aria-hidden>
        {numeral}
      </span>
      <h3 className="eyebrow text-ink">{title}</h3>
      <p className="text-sm text-ink/60 sm:ms-auto sm:text-end">{note}</p>
    </Reveal>
  );
}

export function ProcessWhy() {
  const copy = getCopy();
  const { processSteps } = getDictionary();
  const t = copy.why;
  const s = copy.sequence;

  return (
    <section id="process" className="cv-auto section-y bg-cream text-ink">
      <div className="container-x">
        <SectionHeader eyebrow={t.eyebrow} lines={t.headline} intro={t.intro} />
      </div>

      {/* ---------------- I. The sequence ---------------- */}
      <div className="container-x mt-14 md:mt-20">
        <ChapterRule numeral="I" title={s.chapterOne} note={s.chapterOneNote} />

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <ImageFrame
              image="harvesterLoading"
              className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[3/4]"
              sizes="(min-width: 1024px) 32vw, 100vw"
              parallax={6}
            />
            <Reveal delay={0.15} className="mt-6 hidden lg:block">
              <Button href="/process" variant="link-dark">
                {s.cta}
              </Button>
            </Reveal>
          </div>

          <RevealGroup as="ol" className="grid border-t border-ink/12 sm:grid-cols-2 sm:gap-x-10 lg:col-span-8">
            {processSteps.map((step) => (
              <RevealItem
                as="li"
                key={step.index}
                className="group grid grid-cols-[2.25rem_1fr] gap-4 border-b border-ink/12 py-5 md:grid-cols-[3rem_1fr] md:py-6"
              >
                <span className="mono-num font-display text-xl leading-none text-ink/30 transition-colors duration-500 group-hover:text-gold md:text-2xl">
                  {pad2(step.index)}
                </span>
                <div>
                  <h4 className="display-xs">{step.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{step.summary}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <Reveal delay={0.15} className="mt-8 lg:hidden">
          <Button href="/process" variant="link-dark">
            {s.cta}
          </Button>
        </Reveal>
      </div>

      {/* ---------------- II. The decisions ---------------- */}
      <div id="why" className="container-x mt-16 scroll-mt-28 md:mt-24">
        <ChapterRule numeral="II" title={s.chapterTwo} note={s.chapterTwoNote} />

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <RevealGroup as="ol" className="border-t border-ink/12 lg:col-span-8 lg:order-1">
            {t.items.map((item, i) => (
              <RevealItem
                as="li"
                key={item.title}
                className="group grid grid-cols-[2.25rem_1fr] gap-4 border-b border-ink/12 py-6 md:grid-cols-[5rem_1fr] md:py-8"
              >
                <span className="font-display text-xl leading-none text-ink/30 transition-colors duration-500 group-hover:text-gold md:text-4xl">
                  {pad2(i + 1)}
                </span>
                <div>
                  <h4 className="display-sm">{item.title}</h4>
                  <p className="body-lg mt-2.5 max-w-lg text-ink/65">{item.text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <figure className="lg:order-2 lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <ImageFrame
                image="cornFieldInside"
                className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[3/4]"
                sizes="(min-width: 1024px) 32vw, 100vw"
                parallax={6}
              />
              <figcaption className="mt-3 flex items-center gap-3">
                <span aria-hidden className="h-px w-6 bg-ink/40" />
                <span className="eyebrow text-ink/60">{s.caption}</span>
              </figcaption>
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}
