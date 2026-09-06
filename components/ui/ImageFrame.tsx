"use client";

import Image from "next/image";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type CSSProperties } from "react";
import { media, type MediaKey } from "@/data/media";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/lib/hooks";

/**
 * Editorial image block.
 *  - `reveal`: clip-path wipe + inner scale when scrolled into view
 *  - `parallax`: gentle vertical drift on desktop (disabled on mobile
 *     and for reduced-motion users)
 *  - `grade`: the shared Corn Fodder colour treatment (see `graded` in
 *     styles/globals.css). On by default; pass false to opt out.
 */

interface ImageFrameProps {
  image: MediaKey;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  reveal?: boolean;
  parallax?: number;
  /** Object position, e.g. "50% 30%". */
  position?: string;
  aspect?: string;
  /** Opt out of the shared Corn Fodder grade. */
  grade?: boolean;
  quality?: 60 | 70 | 75 | 85;
  style?: CSSProperties;
}

export function ImageFrame({
  image,
  className,
  imgClassName,
  sizes = "100vw",
  priority,
  reveal = true,
  parallax = 0,
  position,
  aspect,
  grade = true,
  quality = 75,
  style,
}: ImageFrameProps) {
  const asset = media[image];
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const enableParallax = parallax > 0 && isDesktop && !reduce;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [`-${parallax}%`, `${parallax}%`]);

  const img = (
    <Image
      src={asset.src}
      alt={asset.alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={quality}
      className={cn("object-cover", imgClassName)}
      style={position ? { objectPosition: position } : undefined}
    />
  );

  // Let callers position the frame absolutely (page heroes, CTAs).
  const positioned = /\b(absolute|fixed|sticky)\b/.test(className ?? "");
  const rootClass = cn(!positioned && "relative", "overflow-hidden bg-soil/10", className);
  const gradeClass = grade ? "graded" : undefined;

  const inner = enableParallax ? (
    <m.div className="absolute -inset-y-[12%] inset-x-0" style={{ y }}>
      {img}
    </m.div>
  ) : (
    img
  );

  if (reveal && !reduce) {
    // The viewport trigger lives on the unclipped wrapper and drives the
    // clip-path wipe and inner scale through variants.
    return (
      <m.div
        ref={ref}
        className={rootClass}
        style={{ aspectRatio: aspect, ...style }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <m.div
          className={cn("absolute inset-0", gradeClass)}
          variants={{
            hidden: { clipPath: "inset(0 0 100% 0)" },
            show: { clipPath: "inset(0 0 0% 0)", transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
          }}
        >
          <m.div
            className="absolute inset-0"
            variants={{
              hidden: { scale: 1.12 },
              show: { scale: 1, transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            {inner}
          </m.div>
        </m.div>
      </m.div>
    );
  }

  return (
    <div ref={ref} className={cn(rootClass, gradeClass)} style={{ aspectRatio: aspect, ...style }}>
      {inner}
    </div>
  );
}
