"use client";

import Image from "next/image";
import { m, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { media } from "@/data/media";
import { useCopy, useDir } from "@/lib/locale-client";
import { cn, pad2 } from "@/lib/utils";
import { useScrollMapped } from "@/lib/motion";

/**
 * THE PERFECT BALE — signature scroll interaction.
 *
 * Desktop: a sticky viewport with a circular-masked bale that rotates
 * and scales while five callouts fade in around it as you scroll.
 * The track is 300vh — long enough to feel deliberate, short enough
 * that a reader never wonders how much is left.
 * Mobile / reduced motion: a still bale followed by a vertical list.
 * CSS transforms only — no WebGL.
 */

// Placement around the bale (desktop): [x%, y%] of the sticky stage.
const positions: { className: string; align: "start" | "end" }[] = [
  // Logical insets so the composition mirrors in Arabic. The centred
  // callout keeps left-1/2, which is the same position either way.
  { className: "start-[6%] top-[22%] xl:start-[10%]", align: "start" },
  { className: "end-[6%] top-[24%] xl:end-[10%]", align: "end" },
  { className: "start-[6%] top-[58%] xl:start-[10%]", align: "start" },
  { className: "end-[6%] top-[60%] xl:end-[10%]", align: "end" },
  { className: "left-1/2 top-[79%] -translate-x-1/2 text-center", align: "start" },
];

function Callout({
  index,
  callouts,
  dir,
  progress,
}: {
  index: number;
  callouts: { title: string; text: string }[];
  dir: "ltr" | "rtl";
  progress: MotionValue<number>;
}) {
  const item = callouts[index]!;
  const pos = positions[index]!;
  const n = callouts.length;
  const reduce = useReducedMotion();
  // Each callout owns a window of the (shorter) scroll; windows overlap
  // slightly so several are visible at once near the end.
  const start = 0.14 + (index / n) * 0.64;
  const end = start + 0.2;
  const opacity = useScrollMapped(progress, [start, start + 0.05, 0.96, 1], [0, 1, 1, 0.9]);
  const y = useTransform(progress, [start, start + 0.07, end], reduce ? [0, 0, 0] : [22, 0, 0]);
  const lineScale = useTransform(progress, [start, start + 0.09], reduce ? [1, 1] : [0, 1]);

  return (
    <m.div
      className={cn("absolute max-w-[15rem] xl:max-w-[17rem]", pos.className, pos.align === "end" && "text-end")}
      style={{ opacity, y }}
    >
      <p className="eyebrow text-gold">{pad2(index + 1)}</p>
      <m.span
        aria-hidden
        className={cn("my-3 block h-px w-12 bg-gold/60", pos.align === "end" && "ms-auto", index === 4 && "mx-auto")}
        style={{
          scaleX: lineScale,
          // The rule grows from the edge nearest its callout, which is a
          // logical edge — it flips with the document direction.
          transformOrigin:
            (pos.align === "end") === (dir === "ltr") ? "right" : "left",
        }}
      />
      <h3 className="display-xs uppercase tracking-[0.06em] text-cream">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-cream/60">{item.text}</p>
    </m.div>
  );
}

export function PerfectBale() {
  const copy = useCopy();
  const t = copy.perfectBale;
  const callouts = t.callouts;
  const dir = useDir();
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const img = media.baleEnd;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-6, 14]);
  const x = useTransform(scrollYProgress, [0, 0.25], reduce ? ["0%", "0%"] : ["14%", "0%"]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 1], reduce ? [1, 1, 1] : [0.82, 1, 1.06]);
  const ring = useTransform(scrollYProgress, [0.15, 0.95], [0, 1]);
  const headOpacity = useScrollMapped(scrollYProgress, [0, 0.08, 0.16], [1, 1, 0]);
  const headY = useTransform(scrollYProgress, [0, 0.16], reduce ? [0, 0] : [0, -40]);

  return (
    <section className="grain relative bg-ink text-cream" aria-label={t.eyebrow}>
      {/* ---------- Desktop sticky stage ---------- */}
      <div ref={ref} className="relative hidden h-[300vh] lg:block">
        <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0 field-rows text-cream opacity-25" aria-hidden />

          {/* Headline (fades as the story begins) */}
          <m.div
            className="absolute start-[var(--gutter)] top-[16vh] z-10 max-w-md"
            style={{ opacity: headOpacity, y: headY }}
          >
            <Eyebrow className="mb-6">{t.eyebrow}</Eyebrow>
            <h2 className="display-md uppercase">
              {t.headline.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </h2>
          </m.div>

          {/* The bale */}
          <m.div
            className="relative h-[min(68vh,46vw)] w-[min(68vh,46vw)]"
            style={{ rotate, scale, x }}
          >
            <div className="graded absolute inset-0 overflow-hidden rounded-full shadow-[0_70px_140px_-30px_rgba(0,0,0,0.85)]">
              <Image src={img.src} alt={img.alt} fill sizes="46vw" quality={75} className="object-cover" />
              {/* Modelling light: a lit shoulder top-left falling to a dark
                  rim, so the circle reads as a solid object. */}
              <div
                className="absolute inset-0 z-[3] rounded-full bg-[radial-gradient(circle_at_34%_26%,rgba(229,211,166,0.16)_0%,transparent_38%),radial-gradient(circle_at_38%_32%,transparent_42%,rgba(13,16,14,0.62))]"
                aria-hidden
              />
              <div
                className="absolute inset-0 z-[3] rounded-full shadow-[inset_0_-24px_60px_-20px_rgba(0,0,0,0.75)]"
                aria-hidden
              />
            </div>
            {/* Progress ring */}
            <svg className="absolute -inset-[6%] h-[112%] w-[112%] -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(245,241,231,0.12)" strokeWidth="0.35" />
              <m.circle
                cx="50"
                cy="50"
                r="49"
                fill="none"
                stroke="#c9a45c"
                strokeWidth="0.5"
                strokeLinecap="round"
                style={{ pathLength: ring }}
              />
            </svg>
          </m.div>

          {callouts.map((_, i) => (
            <Callout key={i} index={i} callouts={callouts} dir={dir} progress={scrollYProgress} />
          ))}
        </div>
      </div>

      {/* ---------- Mobile / reduced-motion version ---------- */}
      <div className="section-y lg:hidden">
        <div className="container-x">
          <Reveal>
            <Eyebrow className="mb-6">{t.eyebrow}</Eyebrow>
          </Reveal>
          <RevealLines lines={t.headline} className="display-lg uppercase" as="h2" />
          <Reveal className="mx-auto mt-12 w-[min(72vw,22rem)]" y={40}>
            <m.div
              className="graded relative aspect-square overflow-hidden rounded-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
              initial={reduce ? false : { rotate: -8 }}
              whileInView={{ rotate: 4 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image src={img.src} alt={img.alt} fill sizes="72vw" quality={70} className="object-cover" />
              <div
                className="absolute inset-0 z-[3] rounded-full bg-[radial-gradient(circle_at_34%_26%,rgba(229,211,166,0.14)_0%,transparent_38%),radial-gradient(circle_at_38%_32%,transparent_44%,rgba(13,16,14,0.5))]"
                aria-hidden
              />
            </m.div>
          </Reveal>
          <ol className="mt-14 border-t border-cream/12">
            {callouts.map((c, i) => (
              <Reveal as="li" key={c.title} className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-cream/12 py-6" y={20}>
                <span className="eyebrow pt-1 text-gold">{pad2(i + 1)}</span>
                <div>
                  <h3 className="display-xs uppercase">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/60">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
