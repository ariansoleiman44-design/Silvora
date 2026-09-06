"use client";

import { m, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll reveal. Children fade and rise into place once when they enter
 * the viewport. Honors prefers-reduced-m.
 */

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Distance in px. */
  y?: number;
  duration?: number;
  as?: "div" | "section" | "li" | "span" | "p" | "h1" | "h2" | "h3" | "figure";
  once?: boolean;
  amount?: number;
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  duration = 1,
  as = "div",
  once = true,
  amount = 0.2,
}: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = m[as] as typeof m.div;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}

/**
 * Staggered group: wrap several <RevealItem> children.
 */
const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

export function RevealGroup({
  children,
  className,
  as = "div",
  amount = 0.15,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol" | "section";
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const Tag = m[as] as typeof m.div;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  return (
    <Tag
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "span" | "article";
}) {
  const reduce = useReducedMotion();
  const Tag = m[as] as typeof m.div;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  return (
    <Tag className={className} variants={itemVariants}>
      {children}
    </Tag>
  );
}

/**
 * Headline lines that rise from behind a mask, one per line.
 * The viewport trigger sits on the (unclipped) heading and propagates
 * to the masked lines through variants — a clipped element would never
 * intersect on its own.
 */
const lineVariants: Variants = {
  hidden: { y: "110%", rotate: 1.5 },
  show: (i: number) => ({
    y: 0,
    rotate: 0,
    transition: { duration: 1.1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function RevealLines({
  lines,
  className,
  lineClassNames,
  delay = 0,
  as = "h2",
}: {
  lines: readonly string[];
  className?: string;
  /** Optional per-line class names (index-aligned with `lines`). */
  lineClassNames?: readonly (string | undefined)[];
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const reduce = useReducedMotion();
  const Tag = m[as] as typeof m.h2;
  if (reduce) {
    const Plain = as;
    return (
      <Plain className={cn(className)}>
        {lines.map((line, i) => (
          <span key={i} className={cn("block", lineClassNames?.[i])}>
            {line}
          </span>
        ))}
      </Plain>
    );
  }
  return (
    <Tag
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ delayChildren: delay }}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <m.span className={cn("block", lineClassNames?.[i])} variants={lineVariants} custom={i}>
            {line}
          </m.span>
        </span>
      ))}
    </Tag>
  );
}
