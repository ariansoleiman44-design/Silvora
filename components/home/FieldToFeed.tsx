"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

import { media } from "@/data/media";
import { scrollDelta, scrollOffset, scrollProgress } from "@/lib/rtl";
import { useDict } from "@/lib/locale-client";
import { useCopy } from "@/lib/locale-client";
import { cn, pad2 } from "@/lib/utils";

/**
 * "From Field to Feed" — a horizontal, snap-scrolling timeline on
 * desktop with a live progress rule, and a vertical timeline on mobile.
 */
export function FieldToFeed({ tone = "light" }: { tone?: "light" | "dark" }) {
  const copy = useCopy();
  const { processSteps } = useDict();
  const t = copy.process;
  const trackRef = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(1);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // scrollLeft is negative in RTL — see lib/rtl.ts.
    setProgress(scrollProgress(el));
    const cardW = el.scrollWidth / processSteps.length;
    setCurrent(
      Math.min(processSteps.length, Math.max(1, Math.round(scrollOffset(el) / cardW) + 1)),
    );
  }, [processSteps.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const cardW = el.scrollWidth / processSteps.length;
    el.scrollBy({ left: scrollDelta(el, dir, cardW), behavior: "smooth" });
  };

  const dark = tone === "dark";
  const bg = dark ? "bg-ink text-cream" : "bg-cream text-ink";
  const line = dark ? "bg-cream/15" : "bg-ink/12";
  const muted = dark ? "text-cream/60" : "text-ink/60";

  return (
    <section id="process" className={cn("section-y overflow-hidden", bg)}>
      <div className="container-x">
        <SectionHeader
          eyebrow={t.eyebrow}
          lines={t.headline}
          intro={t.intro}
          tone={tone}
          aside={
            <div className="hidden items-center justify-end gap-3 lg:flex">
              <span className={cn("mono-num eyebrow me-4", muted)}>
                {pad2(current)} / {pad2(processSteps.length)}
              </span>
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                aria-label="Previous step"
                className={cn("grid h-12 w-12 place-items-center rounded-full border transition-colors", dark ? "border-cream/25 hover:bg-cream/10" : "border-ink/20 hover:bg-ink hover:text-cream")}
              >
                <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.5} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Next step"
                className={cn("grid h-12 w-12 place-items-center rounded-full border transition-colors", dark ? "border-cream/25 hover:bg-cream/10" : "border-ink/20 hover:bg-ink hover:text-cream")}
              >
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          }
        />
      </div>

      {/* Desktop: horizontal track */}
      <div className="relative mt-14 hidden lg:block">
        <div className="container-x">
          <div className={cn("relative h-px w-full", line)}>
            <div
              className="absolute inset-y-0 start-0 bg-gold transition-[width] duration-150"
              style={{ width: `${Math.max(8, progress * 100)}%` }}
              aria-hidden
            />
          </div>
        </div>
        <ol
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-8 overflow-x-auto px-[var(--gutter)] scroll-ps-[var(--gutter)] pt-10 pb-4"
          aria-label={t.eyebrow}
        >
          {processSteps.map((step) => {
            const img = media[step.image];
            return (
              <li key={step.index} className="group w-[clamp(18rem,26vw,24rem)] shrink-0 snap-start">
                <div className="img-zoom graded relative aspect-[4/5] overflow-hidden bg-stone">
                  {/*
                    The card is w-[clamp(18rem,26vw,24rem)], so the plain
                    "26vw" this used to declare asked for a ~101px file
                    inside a 288px box on a phone — visibly soft. The
                    breakpoints are where the clamp actually changes
                    hands: 26vw equals 18rem at 1108px and 24rem at
                    1477px.
                  */}
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 1477px) 24rem, (min-width: 1108px) 26vw, 18rem"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 top-0 z-[3] h-1/3 bg-gradient-to-b from-ink/60 to-transparent" aria-hidden />
                  <span className="absolute start-4 top-4 z-[3] font-display text-4xl text-cream">
                    {pad2(step.index)}
                  </span>
                </div>
                <h3 className="display-sm mt-6">{step.title}</h3>
                <p className={cn("mt-2 font-display text-xl italic", dark ? "text-wheat/80" : "text-ink/70")}>{step.summary}</p>
                <p className={cn("mt-3 max-w-xs text-sm leading-relaxed", muted)}>{step.detail}</p>
              </li>
            );
          })}
          <li aria-hidden className="w-[var(--gutter)] shrink-0" />
        </ol>
        <p className={cn("container-x mt-2 eyebrow", muted)}>{t.dragHint}</p>
      </div>

      {/* Mobile / tablet: vertical timeline */}
      <ol className="container-x mt-12 lg:hidden">
        {processSteps.map((step, i) => {
          const img = media[step.image];
          const last = i === processSteps.length - 1;
          return (
            <li key={step.index} className="relative grid grid-cols-[2.5rem_1fr] gap-x-4 sm:grid-cols-[3rem_1fr] sm:gap-x-6">
              <div className="relative flex flex-col items-center">
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border font-display text-base", dark ? "border-cream/30" : "border-ink/25")}>
                  {pad2(step.index)}
                </span>
                {!last && <span className={cn("mt-2 w-px flex-1", line)} aria-hidden />}
              </div>
              <Reveal className={cn("pb-12", last && "pb-0")} y={20}>
                <div className="grid grid-cols-5 gap-4">
                  <div className="graded relative col-span-2 aspect-[4/5] overflow-hidden bg-stone">
                    <Image src={img.src} alt={img.alt} fill sizes="40vw" className="object-cover" />
                  </div>
                  <div className="col-span-3 flex flex-col justify-center">
                    <h3 className="display-sm">{step.title}</h3>
                    <p className={cn("mt-1 font-display text-lg italic", dark ? "text-wheat/80" : "text-ink/70")}>{step.summary}</p>
                  </div>
                </div>
                <p className={cn("mt-4 text-sm leading-relaxed", muted)}>{step.detail}</p>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
