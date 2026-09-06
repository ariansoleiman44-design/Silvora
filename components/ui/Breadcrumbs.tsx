import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  tone = "light",
  className,
}: {
  items: Crumb[];
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("eyebrow", className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.name}-${i}`} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className={cn(
                    "link-line transition-opacity",
                    tone === "dark" ? "text-cream/60 hover:text-cream" : "text-ink/65 hover:text-ink",
                  )}
                >
                  {item.name}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={tone === "dark" ? "text-cream" : "text-ink"}
                >
                  {item.name}
                </span>
              )}
              {!last && (
                <ChevronRight
                  className={cn("h-3 w-3 rtl:-scale-x-100", tone === "dark" ? "text-cream/60" : "text-ink/60")}
                  strokeWidth={1.5}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
