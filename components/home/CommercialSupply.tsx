import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal, RevealLines } from "@/components/ui/Reveal";
import { getCopy } from "@/lib/dictionary";
import { cn } from "@/lib/utils";

/**
 * A quiet band for buyers who order on a schedule rather than once.
 *
 * Deliberately not another homepage chapter: it is a single ruled block
 * that sits inside an existing section's rhythm (Logistics, or above the
 * closing CTA), so the page gains a commercial signal without gaining
 * another scroll stop.
 */
export function CommercialSupply({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const copy = getCopy();
  const t = copy.commercial;
  const dark = tone === "dark";

  return (
    <section className={cn(dark ? "bg-forest-deep text-cream" : "bg-cream text-ink", className)}>
      <div className="container-x section-y-sm">
        <div className={cn("grid gap-8 border-t pt-8 lg:grid-cols-12 lg:gap-10", dark ? "border-cream/20" : "border-ink/20")}>
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow className="mb-5">{t.eyebrow}</Eyebrow>
            </Reveal>
            <RevealLines lines={t.headline} className="display-sm uppercase" />
          </div>

          <div className="lg:col-span-4">
            <Reveal delay={0.1}>
              <p className={cn("body-lg max-w-sm", dark ? "text-cream/70" : "text-ink/65")}>{t.intro}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <ul className={cn("mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs uppercase tracking-[0.14em]", dark ? "text-cream/55" : "text-ink/60")}>
                {t.audience.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.2} className="lg:col-span-3 lg:justify-self-end">
            <Button href="/quote" variant={dark ? "outline-light" : "outline-dark"} size="lg">
              {t.cta}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
