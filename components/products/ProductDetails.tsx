"use client";

import { useEffect, useState } from "react";
import { Accordion } from "@/components/ui/Accordion";
import { useCopy } from "@/lib/locale-client";
import { labPlaceholderText } from "@/data/lab-data";
import { visibleSpecs, withoutDemo } from "@/lib/demo-policy";
import type { Product, SpecItem } from "@/types/product";
import { cn } from "@/lib/utils";

/**
 * Product information: a sticky in-page navigation with long-form
 * sections on desktop, and an accordion on mobile.
 */

/**
 * Specification rows. Unverified (`demo: true`) figures are removed in
 * production by lib/demo-policy.ts — a buyer plans equipment around
 * these numbers, so a placeholder must never appear as one.
 */
function specList(product: Product): SpecItem[] {
  return visibleSpecs([
    product.weight,
    product.dimensions,
    product.wrapping,
    product.chop,
    product.moisture,
    product.storage,
    product.minimumOrder,
    product.delivery,
    product.harvestOrigin,
  ]);
}

function DemoTag({ note, label }: { note: string; label: string }) {
  return (
    <span
      className="ms-2 inline-block align-middle text-[0.5625rem] font-semibold uppercase tracking-[0.18em] text-gold"
      title={note}
    >
      {label}
    </span>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it} className="flex gap-4">
          <span aria-hidden className="mt-3 h-px w-5 shrink-0 bg-gold" />
          <span className="body-lg text-ink/75">{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProductDetails({ product }: { product: Product }) {
  const copy = useCopy();
  const t = copy.product.sections;
  const specs = specList(product);
  const hasDemo = specs.some((s) => s.demo);

  const sections: { id: string; title: string; content: React.ReactNode }[] = [
    {
      id: "overview",
      title: t.overview,
      content: (
        <div className="space-y-5">
          {product.description.map((p, i) => (
            <p key={i} className="body-lg text-ink/75">
              {p}
            </p>
          ))}
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {product.features.map((f) => (
              <li key={f} className="border-t border-ink/12 pt-3 text-sm text-ink/75">
                {f}
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: "specifications",
      title: t.specifications,
      content: (
        <div>
          <dl className="divide-y divide-ink/10 border-y border-ink/10">
            {specs.map((s) => (
              <div key={s.label} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                <dt className="text-sm text-ink/60">{s.label}</dt>
                <dd className="text-base text-ink">
                  {s.value}
                  {s.demo && <DemoTag note={copy.common.demoNote} label={copy.common.demoLabel} />}
                  {s.note && <span className="mt-1 block text-xs text-ink/60">{s.note}</span>}
                </dd>
              </div>
            ))}
          </dl>
          {hasDemo && <p className="mt-4 text-xs text-ink/60">{copy.common.demoNote}</p>}
        </div>
      ),
    },
    {
      id: "nutrition",
      title: t.nutrition,
      content: (
        <div>
          <dl className="grid gap-px border border-ink/12 bg-ink/12 sm:grid-cols-3">
            {withoutDemo(product.nutrition ?? []).map((n) => (
              <div key={n.key} className="bg-cream p-4">
                <dt className="eyebrow text-ink/60">{n.label}</dt>
                <dd className="mt-2 font-display text-2xl">
                  {typeof n.value === "number" ? (
                    <>
                      {n.value}
                      <span className="ms-1 text-sm text-ink/60">{n.unit}</span>
                      {n.demo && <DemoTag note={copy.common.demoNote} label={copy.common.demoLabel} />}
                    </>
                  ) : (
                    <span className="text-base italic text-ink/60">{labPlaceholderText}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-ink/60">{copy.product.nutritionNote}</p>
        </div>
      ),
    },
    { id: "best-for", title: t.bestFor, content: <List items={product.bestFor} /> },
    { id: "storage", title: t.storage, content: <List items={product.storageGuidance} /> },
    { id: "handling", title: t.handling, content: <List items={product.handling} /> },
    { id: "delivery", title: t.delivery, content: <List items={product.deliveryNotes} /> },
  ];

  if (product.faq && product.faq.length) {
    sections.push({
      id: "faq",
      title: t.faq,
      content: (
        <dl className="divide-y divide-ink/10">
          {product.faq.map((f) => (
            <div key={f.question} className="py-4">
              <dt className="display-xs">{f.question}</dt>
              <dd className="mt-2 body-lg text-ink/70">{f.answer}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }

  // Active section tracking for the desktop nav.
  const [active, setActive] = useState(sections[0]?.id ?? "overview");
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(`sec-${s.id}`)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = visible[0];
        if (first) setActive(first.target.id.replace("sec-", ""));
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);

  return (
    <div className="container-x">
      {/* Mobile accordion */}
      <div className="lg:hidden">
        <Accordion
          items={sections.map((s) => ({ id: s.id, title: s.title, content: s.content }))}
          defaultOpen={[0]}
          headingLevel={2}
        />
      </div>

      {/* Desktop */}
      <div className="hidden gap-8 lg:grid lg:grid-cols-12">
        <nav aria-label="Product sections" className="lg:col-span-3">
          <ul className="sticky top-28 space-y-1 border-s border-ink/12">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#sec-${s.id}`}
                  aria-current={active === s.id ? "true" : undefined}
                  className={cn(
                    "-ms-px block border-s py-2 ps-5 text-sm transition-colors",
                    active === s.id ? "border-gold text-ink" : "border-transparent text-ink/60 hover:text-ink",
                  )}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="lg:col-span-8 lg:col-start-5">
          {sections.map((s) => (
            <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-28 border-t border-ink/12 py-12 first:border-t-0 first:pt-0">
              <h2 className="display-sm mb-8">{s.title}</h2>
              {s.content}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
