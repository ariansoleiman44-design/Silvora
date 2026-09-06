import Image from "next/image";
import { siteConfig } from "@/data/site-config";
import { cn } from "@/lib/utils";

/**
 * Corn Fodder logo system.
 *
 * The symbol is the supplied corporate mark: a maize cob rising from
 * husk leaves, gold on green. It ships as a transparent PNG rather than
 * as SVG because the artwork was delivered as a raster file with
 * gradients — redrawing it as vectors would be a redesign, not a
 * conversion.
 *
 *   <Logo variant="horizontal" tone="light" />   header on dark
 *   <Logo variant="symbol" />                    mark only
 *   <Logo variant="wordmark" />                  footer super-size
 *
 * THE MARK IS REVERSED ON DARK SURFACES. In the original file the cob
 * kernels and the gaps between the leaves are white, because the
 * artwork is drawn for a white page. That white is background, not
 * ink, so it is transparent here and takes the colour of whatever sits
 * behind it — which is what gives a clean gold-and-green mark on the
 * forest header instead of a white box. On a light surface it reads
 * exactly as supplied.
 *
 * SIZE MATTERS FOR THIS MARK. It is a fine-line design: at 29px the
 * outlines collapse into a smudge, so the horizontal lockup renders it
 * at 2.4em (~40px) rather than the 1.75em the old mark used. Below
 * roughly 36px it stops being readable at all. If you need it smaller
 * than that, ask whoever drew it for a simplified single-weight version
 * — no amount of scaling here will fix it.
 *
 * The name beside it is TYPESET, not part of the image, so it stays
 * crisp at every size and can follow the page language. The supplied
 * lockup pairs the Latin name with علف الذرة; the Arabic form is set in
 * data/ar/copy.ar.ts and used on the Arabic pages.
 */

type Tone = "light" | "dark" | "gold";

interface LogoProps {
  variant?: "horizontal" | "symbol" | "wordmark";
  tone?: Tone;
  className?: string;
  title?: string;
  /**
   * Display name beside the mark. Callers pass the locale's form via
   * lib/brand.ts — the Arabic pages show علف الذرة, as the supplied
   * lockup pairs it. Defaults to the Latin name.
   */
  name?: string;
}

/** The corn mark on its own. */
export function LogoSymbol({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <Image
      src="/logo/symbol.png"
      alt={title ?? ""}
      width={512}
      height={512}
      // Rendered between roughly 26px and 96px. Asking for 128 keeps it
      // sharp on a 2x display without shipping the full 512.
      sizes="128px"
      className={cn("shrink-0 object-contain", className)}
      // Decorative wherever no title is given: the brand name is
      // already beside it as real text.
      aria-hidden={title ? undefined : true}
    />
  );
}

export function Logo({
  variant = "horizontal",
  tone = "dark",
  className,
  name = siteConfig.brandName,
  title,
}: LogoProps) {
  const label = title ?? name;
  if (variant === "symbol") {
    return <LogoSymbol className={className} title={label} />;
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
        {name}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", textColor, className)}>
      <LogoSymbol className="h-[2.4em] w-[2.4em]" />
      <span className="font-display uppercase tracking-[0.16em] leading-none text-[1.05em] translate-y-[0.06em]">
        {name}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
