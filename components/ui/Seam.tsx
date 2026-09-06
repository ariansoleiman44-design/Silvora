import { cn } from "@/lib/utils";
import { pad2 } from "@/lib/utils";

/**
 * Chapter seam — the transition between two movements of a page.
 *
 * A seam belongs to the section it introduces: give it that section's
 * background so cream → forest → near-black changes happen on a ruled
 * line rather than on a hard edge. Purely typographic, no JS, hidden
 * from assistive technology (the sections carry the real headings).
 */
interface SeamProps {
  index: number;
  label: string;
  /** Background of the section this seam introduces. */
  bg: string;
  tone?: "light" | "dark";
  className?: string;
}

export function Seam({ index, label, bg, tone = "light", className }: SeamProps) {
  const dark = tone === "dark";
  return (
    <div className={cn(bg, className)} aria-hidden>
      <div className="container-x flex items-center gap-4 pt-10 md:gap-6 md:pt-14">
        <span className="mono-num eyebrow text-gold">{pad2(index)}</span>
        <span className={cn("h-px flex-1", dark ? "bg-cream/15" : "bg-ink/15")} />
        <span className={cn("eyebrow truncate", dark ? "text-cream/55" : "text-ink/50")}>{label}</span>
      </div>
    </div>
  );
}
