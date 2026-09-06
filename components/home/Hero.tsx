"use client";

import Image from "next/image";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { HeroVideo } from "@/components/home/HeroVideo";
import { media } from "@/data/media";
import { useCopy } from "@/lib/locale-client";
import { useIsDesktop } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { useScrollMapped } from "@/lib/motion";

export function Hero() {
  const copy = useCopy();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const t = copy.hero;
  const img = media.homeHeroPoster;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", isDesktop && !reduce ? "18%" : "0%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", isDesktop && !reduce ? "-30%" : "0%"]);
  const fade = useScrollMapped(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="grain relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink text-cream"
      aria-labelledby="hero-heading"
    >
      {/*
        The still is the LCP element and always renders. The video, when
        it renders at all, fades in over it — see HeroVideo for who does
        not get it.

        The video sits OUTSIDE the animate-hero-zoom wrapper on purpose:
        the footage already moves, and scaling a playing video would be
        a pointless composite on every frame. Both layers still share
        the parallax transform on the parent.
      */}
      <m.div className="graded absolute inset-0" style={{ y: imgY }}>
        <div className="absolute inset-0 animate-hero-zoom">
          <Image
            src={img.src}
            alt={img.alt}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={70}
            className="object-cover object-[62%_50%] md:object-[50%_50%]"
          />
        </div>
        <HeroVideo />
      </m.div>

      {/* Light + legibility */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10 md:via-ink/55" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-transparent" />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-1/4 end-[-10%] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(closest-side,rgba(224,196,130,0.28),transparent)] blur-2xl",
          !reduce && "animate-sun-drift",
        )}
      />

      {/* Content */}
      <m.div
        className="container-x relative z-10 pb-28 pt-36 md:pb-32 md:pt-40 lg:pb-36"
        style={{ y: textY, opacity: fade }}
      >
        <p className="inline-flex max-w-full animate-rise-in items-center gap-2.5 rounded-full border border-cream/20 bg-ink/25 px-3 py-1.5 backdrop-blur-md sm:gap-3 sm:px-4 sm:py-2 [animation-delay:250ms]">
          <span aria-hidden className="h-1 w-1 rounded-full bg-gold sm:h-1.5 sm:w-1.5" />
          <span className="eyebrow text-[0.625rem] text-cream/90 sm:text-[0.6875rem]">{t.badge}</span>
        </p>

        <h1 id="hero-heading" className="display-xl mt-6 max-w-[12ch] uppercase sm:mt-8">
          {t.headline.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
              <span
                className={cn("block animate-rise-line", i === 1 && "normal-case italic text-wheat")}
                style={{ animationDelay: `${400 + i * 120}ms` }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-7 grid gap-7 md:mt-10 md:gap-8 lg:grid-cols-12 lg:items-end">
          <p className="lead max-w-md animate-rise-in text-cream/80 lg:col-span-5 [animation-delay:800ms]">
            {t.sub}
          </p>
          <div className="flex animate-rise-in flex-col gap-3 xs:flex-row lg:col-span-7 lg:justify-end [animation-delay:950ms]">
            <Button href="/products" variant="gold" size="lg" className="w-full xs:w-auto">
              {t.primary}
            </Button>
            <Button href="/quote" variant="outline-light" size="lg" icon="none" className="w-full xs:w-auto">
              {t.secondary}
            </Button>
          </div>
        </div>
      </m.div>

      {/* Bottom strip */}
      <div className="container-x absolute inset-x-0 bottom-0 z-10 flex animate-fade-in items-end justify-between pb-5 md:pb-8 [animation-delay:1300ms]">
        <a href="#trust" className="group flex items-center gap-3 text-cream/70 hover:text-cream" aria-label={copy.common.scroll}>
          <span className="relative block h-12 w-px overflow-hidden bg-cream/20">
            <span className="absolute inset-0 origin-top animate-line-grow bg-gold" />
          </span>
          <span className="eyebrow">{copy.common.scroll}</span>
        </a>
        <p className="hidden items-center gap-6 text-cream/60 md:flex">
          <span className="text-sm">{t.caption}</span>
          <span className="eyebrow text-gold">{t.index}</span>
        </p>
      </div>
    </section>
  );
}
