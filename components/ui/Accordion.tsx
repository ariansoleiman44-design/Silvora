"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItemData {
  id?: string;
  title: ReactNode;
  content: ReactNode;
  /** Small text shown before the title (e.g. "01"). */
  index?: string;
}

interface AccordionProps {
  items: AccordionItemData[];
  tone?: "light" | "dark";
  /** Allow several open at once. */
  multiple?: boolean;
  defaultOpen?: number[];
  className?: string;
  titleClassName?: string;
  /** Heading level used for each item title. */
  headingLevel?: 2 | 3;
}

export function Accordion({
  items,
  tone = "light",
  multiple = false,
  defaultOpen = [],
  className,
  titleClassName,
  headingLevel = 3,
}: AccordionProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const [open, setOpen] = useState<number[]>(defaultOpen);
  const baseId = useId();
  const reduce = useReducedMotion();

  const toggle = (i: number) =>
    setOpen((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : multiple ? [...prev, i] : [i],
    );

  const border = tone === "dark" ? "border-cream/15" : "border-ink/12";
  const text = tone === "dark" ? "text-cream" : "text-ink";
  const muted = tone === "dark" ? "text-cream/65" : "text-ink/65";

  return (
    <div className={cn("divide-y border-y", border, className)} style={{ borderColor: undefined }}>
      {items.map((item, i) => {
        const isOpen = open.includes(i);
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={item.id ?? i} className={cn(border)}>
            <Heading className="m-0">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                className={cn(
                  "group flex w-full items-start justify-between gap-6 py-5 text-start md:py-6",
                  text,
                )}
              >
                <span className="flex items-baseline gap-4">
                  {item.index && (
                    <span className={cn("eyebrow shrink-0 translate-y-[-0.1em]", muted)}>
                      {item.index}
                    </span>
                  )}
                  <span className={cn("display-xs", titleClassName)}>{item.title}</span>
                </span>
                <span
                  className={cn(
                    "mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors duration-500",
                    tone === "dark"
                      ? "border-cream/25 group-hover:border-cream/60"
                      : "border-ink/20 group-hover:border-ink/60",
                  )}
                >
                  <Plus
                    className={cn(
                      "h-4 w-4 transition-transform duration-500 ease-[var(--ease-luxe)]",
                      isOpen && "rotate-45",
                    )}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                </span>
              </button>
            </Heading>
            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  key="content"
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className={cn("body-lg max-w-2xl pb-6 pe-12 md:pb-8", muted)}>
                    {item.content}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
