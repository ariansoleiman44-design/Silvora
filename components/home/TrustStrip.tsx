import { Leaf, Layers, Truck, Shield } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { getCopy } from "@/lib/dictionary";
import { pad2 } from "@/lib/utils";

const icons = [Leaf, Layers, Truck, Shield];

/** Four quiet promises. No certifications, no numbers we don't have. */
export function TrustStrip() {
  const copy = getCopy();
  return (
    <section id="trust" className="cv-auto bg-cream text-ink">
      <h2 className="sr-only">Our promises</h2>
      <div className="container-x py-4 md:py-6">
        <RevealGroup
          as="ul"
          className="grid grid-cols-2 gap-px border-y border-ink/10 bg-ink/10 lg:grid-cols-4"
        >
          {copy.trust.items.map((item, i) => {
            const Icon = icons[i] ?? Leaf;
            return (
              <RevealItem as="li" key={item.title} className="bg-cream p-5 sm:p-7 md:p-9 lg:px-8 lg:py-12">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-leaf" strokeWidth={1.25} aria-hidden />
                  <span className="eyebrow text-ink/60">{pad2(i + 1)}</span>
                </div>
                <h3 className="display-xs mt-6">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{item.text}</p>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
