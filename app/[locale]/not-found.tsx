import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { media } from "@/data/media";
import { getCopy } from "@/lib/dictionary";

export default function NotFound() {
  const copy = getCopy();
  const t = copy.notFound;
  const img = media.cornHorizon;
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink text-cream">
      <Image src={img.src} alt="" fill sizes="100vw" className="object-cover opacity-50" priority />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" aria-hidden />
      <div className="container-x relative z-10 pb-20 pt-40 md:pb-28">
        <Eyebrow>{t.eyebrow}</Eyebrow>
        <h1 className="display-xl mt-6 uppercase">
          {t.headline.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h1>
        <p className="lead mt-6 max-w-lg text-cream/70">{t.text}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button href="/" variant="gold">
            {t.cta}
          </Button>
          <Button href="/products" variant="outline-light">
            {t.secondary}
          </Button>
        </div>
      </div>
    </section>
  );
}
