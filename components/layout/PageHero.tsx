import type { ReactNode } from "react";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import type { MediaKey } from "@/data/media";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  lines: readonly string[];
  intro?: string;
  image?: MediaKey;
  crumbs?: Crumb[];
  size?: "lg" | "md" | "sm";
  children?: ReactNode;
  /** Focus point for the photograph. */
  position?: string;
  italicLast?: boolean;
}

/**
 * Dark page opener used on every inner page so the transparent header
 * always sits on photography. Three heights: lg (cinematic), md, sm.
 */
export function PageHero({
  eyebrow,
  lines,
  intro,
  image,
  crumbs,
  size = "md",
  children,
  position,
  italicLast,
}: PageHeroProps) {
  const heights = {
    lg: "min-h-[88svh]",
    md: "min-h-[62svh]",
    sm: "min-h-[38svh]",
  };
  return (
    <section className={cn("grain relative flex flex-col justify-end overflow-hidden bg-ink text-cream", heights[size])}>
      {image && (
        <ImageFrame
          image={image}
          className="absolute inset-0"
          sizes="100vw"
          priority
          reveal={false}
          parallax={8}
          position={position}
          quality={75}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" aria-hidden />
      <div className="container-x relative z-10 pb-12 pt-36 md:pb-16 md:pt-44">
        {crumbs && (
          <Reveal>
            <Breadcrumbs items={crumbs} tone="dark" className="mb-8" />
          </Reveal>
        )}
        {eyebrow && (
          <Reveal>
            <Eyebrow className="mb-6">{eyebrow}</Eyebrow>
          </Reveal>
        )}
        <RevealLines
          as="h1"
          lines={lines}
          className={cn(size === "lg" ? "display-xl" : "display-lg", "max-w-5xl uppercase")}
          lineClassNames={lines.map((_, i) =>
            italicLast && i === lines.length - 1 ? "italic normal-case text-wheat" : undefined,
          )}
        />
        {intro && (
          <Reveal delay={0.2}>
            <p className="lead mt-6 max-w-xl text-cream/75">{intro}</p>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
