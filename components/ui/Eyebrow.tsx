import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: ReactNode;
  tone?: "gold" | "muted" | "light" | "dark";
  /** Leading hairline rule. */
  rule?: boolean;
  className?: string;
  as?: "p" | "span" | "div";
}

const tones = {
  gold: "text-gold",
  muted: "text-ink/60",
  light: "text-cream/70",
  dark: "text-ink",
};

export function Eyebrow({ children, tone = "gold", rule = true, className, as = "p" }: EyebrowProps) {
  const Tag = as;
  return (
    <Tag className={cn("eyebrow inline-flex items-center gap-3", tones[tone], className)}>
      {rule && <span aria-hidden className="block h-px w-8 bg-current opacity-70" />}
      <span>{children}</span>
    </Tag>
  );
}
