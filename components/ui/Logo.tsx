import { siteConfig } from "@/data/site-config";
import { cn } from "@/lib/utils";

/**
 * SILVORA logo system.
 *
 * The symbol is a wrapped bale (circle) with a maize leaf whose midrib
 * traces an "S". The rib is cut out in the background colour so the mark
 * works as a single-colour emboss.
 *
 *   <Logo variant="horizontal" tone="light" />   header on dark
 *   <Logo variant="symbol" tone="dark" />        favicon-like use
 *   <Logo variant="wordmark" />                  footer super-size
 *
 * Static SVG files for print / social live in /public/logo.
 */

type Tone = "light" | "dark" | "gold";

interface LogoProps {
  variant?: "horizontal" | "symbol" | "wordmark";
  tone?: Tone;
  className?: string;
  /** Background colour used for the rib cut-out. Defaults per tone. */
  ribColor?: string;
  title?: string;
}

const toneColor: Record<Tone, string> = {
  light: "#F5F1E7",
  dark: "#102A20",
  gold: "#C9A45C",
};

const toneRib: Record<Tone, string> = {
  light: "#0D100E",
  dark: "#F5F1E7",
  gold: "#0D100E",
};

export function LogoSymbol({
  tone = "dark",
  className,
  ribColor,
  title,
}: Omit<LogoProps, "variant">) {
  const color = toneColor[tone];
  const rib = ribColor ?? toneRib[tone];
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="2.25" />
      <path d="M 15 49 C 15 31 31 15 49 15 C 49 33 33 49 15 49 Z" fill={color} />
      <path
        d="M 18 46 C 36 42 22 30 46 18"
        stroke={rib}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  variant = "horizontal",
  tone = "dark",
  className,
  ribColor,
  title = siteConfig.brandName,
}: LogoProps) {
  if (variant === "symbol") {
    return <LogoSymbol tone={tone} className={className} ribColor={ribColor} title={title} />;
  }

  const textColor =
    tone === "light" ? "text-cream" : tone === "gold" ? "text-gold" : "text-forest";

  if (variant === "wordmark") {
    return (
      <span
        className={cn(
          "font-display uppercase tracking-[0.12em] leading-none select-none",
          textColor,
          className,
        )}
      >
        {siteConfig.brandName}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", textColor, className)}>
      <LogoSymbol tone={tone} className="h-[1.6em] w-[1.6em]" ribColor={ribColor} />
      <span className="font-display uppercase tracking-[0.2em] leading-none text-[1.05em] translate-y-[0.06em]">
        {siteConfig.brandName}
      </span>
      <span className="sr-only">{title}</span>
    </span>
  );
}
