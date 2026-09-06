import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/**
 * Standard section opener: eyebrow, multi-line display headline and an
 * optional intro paragraph or action on the opposite side.
 */
interface SectionHeaderProps {
  eyebrow?: string;
  lines: readonly string[];
  intro?: string;
  tone?: "light" | "dark";
  size?: "lg" | "md";
  align?: "start" | "center";
  aside?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
  italicLast?: boolean;
}

export function SectionHeader({
  eyebrow,
  lines,
  intro,
  tone = "light",
  size = "lg",
  align = "start",
  aside,
  className,
  as = "h2",
  italicLast = false,
}: SectionHeaderProps) {
  const dark = tone === "dark";
  return (
    <div
      className={cn(
        "grid gap-8 md:grid-cols-12 md:items-end",
        align === "center" && "text-center md:grid-cols-1",
        className,
      )}
    >
      <div className={cn(align === "center" ? "mx-auto max-w-3xl" : "md:col-span-8")}>
        {eyebrow && (
          <Reveal>
            <Eyebrow
              tone={dark ? "gold" : "gold"}
              rule={align !== "center"}
              className="mb-6"
            >
              {eyebrow}
            </Eyebrow>
          </Reveal>
        )}
        <RevealLines
          as={as}
          lines={lines}
          className={cn(
            size === "lg" ? "display-lg" : "display-md",
            "uppercase",
            dark ? "text-cream" : "text-ink",
          )}
          lineClassNames={lines.map((_, i) =>
            italicLast && i === lines.length - 1 ? "italic normal-case text-gold-light" : undefined,
          )}
        />
      </div>
      {(intro || aside) && (
        <div
          className={cn(
            align === "center" ? "mx-auto max-w-xl" : "md:col-span-4 md:pb-2",
          )}
        >
          {intro && (
            <Reveal delay={0.15}>
              <p className={cn("lead", dark ? "text-cream/70" : "text-ink/65")}>{intro}</p>
            </Reveal>
          )}
          {aside && <Reveal delay={0.2}>{aside}</Reveal>}
        </div>
      )}
    </div>
  );
}
