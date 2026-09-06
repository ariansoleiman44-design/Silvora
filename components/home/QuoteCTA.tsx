import { Button } from "@/components/ui/Button";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { getCopy } from "@/lib/dictionary";
import type { MediaKey } from "@/data/media";

interface QuoteCTAProps {
  image?: MediaKey;
  headline?: readonly string[];
  sub?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}

/**
 * Cinematic full-bleed call to action. Reused on several pages.
 */
export function QuoteCTA({
  image = "balesSunset",
  headline: headlineProp,
  sub: subProp,
  primary: primaryProp,
  secondary: secondaryProp,
}: QuoteCTAProps) {
  // Defaults are resolved here rather than in the parameter list: the
  // dictionary is per-request, and a default argument is evaluated
  // against whatever locale happened to load the module first.
  const copy = getCopy();
  const t = copy.quoteCta;
  const headline = headlineProp ?? t.headline;
  const sub = subProp ?? t.sub;
  const primary = primaryProp ?? { label: t.primary, href: "/quote" };
  const secondary = secondaryProp ?? { label: t.secondary, href: "/contact" };

  return (
    <section className="grain relative isolate overflow-hidden bg-ink text-cream">
      <ImageFrame
        image={image}
        className="absolute inset-0 -z-10"
        sizes="100vw"
        parallax={10}
        reveal={false}
        quality={70}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/50 to-ink/30" aria-hidden />
      <div className="container-x flex min-h-[70svh] flex-col justify-end py-20 md:min-h-[80svh] md:py-28">
        <RevealLines lines={headline} className="display-xl max-w-4xl uppercase" />
        <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end">
          <Reveal className="md:col-span-6" delay={0.15}>
            <p className="lead max-w-md text-cream/75">{sub}</p>
          </Reveal>
          <Reveal className="flex flex-col gap-3 sm:flex-row md:col-span-6 md:justify-end" delay={0.25}>
            <Button href={primary.href} variant="gold" size="lg">
              {primary.label}
            </Button>
            <Button href={secondary.href} variant="outline-light" size="lg" icon="none">
              {secondary.label}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
