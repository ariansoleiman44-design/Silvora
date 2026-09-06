import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Button / link primitive.
 *
 * Variants map to the brand: gold for the primary conversion, ink and
 * cream for tonal contexts, outline for secondary actions on either
 * background, and `link` for arrowed text links.
 */

export type ButtonVariant =
  | "gold"
  | "ink"
  | "cream"
  | "outline-light"
  | "outline-dark"
  | "ghost-light"
  | "ghost-dark"
  | "link-light"
  | "link-dark";

type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: Size;
  icon?: "arrow" | "external" | "none";
  iconPosition?: "end" | "start";
  full?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = BaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof BaseProps> & { href?: undefined };

type ButtonAsLink = BaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof BaseProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  "group/btn relative inline-flex max-w-full items-center justify-center gap-3 select-none text-center leading-snug font-sans font-semibold uppercase tracking-[0.14em] transition-[background-color,color,border-color,transform,box-shadow] duration-500 ease-[var(--ease-luxe)] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

const sizes: Record<Size, string> = {
  sm: "min-h-11 px-5 py-2 text-[0.6875rem] rounded-[2px]",
  md: "min-h-[3.25rem] px-7 py-3 text-[0.75rem] rounded-[2px]",
  lg: "min-h-14 px-9 py-3 text-[0.8125rem] rounded-[2px]",
};

const variants: Record<ButtonVariant, string> = {
  gold: "bg-gold text-ink hover:bg-gold-light",
  ink: "bg-ink text-cream hover:bg-forest",
  cream: "bg-cream text-ink hover:bg-white",
  "outline-light":
    "border border-cream/50 text-cream hover:border-cream hover:bg-cream/10",
  "outline-dark":
    "border border-ink/30 text-ink hover:border-ink hover:bg-ink hover:text-cream",
  "ghost-light": "text-cream hover:bg-cream/10",
  "ghost-dark": "text-ink hover:bg-ink/5",
  "link-light": "h-auto px-0 text-cream normal-case tracking-[0.02em] font-medium text-base",
  "link-dark": "h-auto px-0 text-ink normal-case tracking-[0.02em] font-medium text-base",
};

function Icon({ kind }: { kind: NonNullable<BaseProps["icon"]> }) {
  if (kind === "none") return null;
  const I = kind === "external" ? ArrowUpRight : ArrowRight;
  return (
    <I
      className={cn(
        "h-4 w-4 shrink-0 transition-transform duration-500 ease-[var(--ease-luxe)] rtl:-scale-x-100",
        kind === "arrow"
          ? "group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1"
          : "group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5",
      )}
      strokeWidth={1.75}
      aria-hidden
    />
  );
}

export function Button(props: ButtonProps) {
  const {
    variant = "gold",
    size = "md",
    icon = "arrow",
    iconPosition = "end",
    full,
    className,
    children,
    ...rest
  } = props;

  const isLink = variant.startsWith("link");
  const classes = cn(
    base,
    isLink ? "" : sizes[size],
    variants[variant],
    isLink && "link-line",
    full && "w-full",
    className,
  );

  const content = (
    <>
      {iconPosition === "start" && <Icon kind={icon} />}
      <span>{children}</span>
      {iconPosition === "end" && <Icon kind={icon} />}
    </>
  );

  if ("href" in rest && typeof rest.href === "string") {
    const { href, ...linkRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {content}
      </Link>
    );
  }

  const buttonRest = rest as ButtonAsButton;
  return (
    <button type={buttonRest.type ?? "button"} className={classes} {...buttonRest}>
      {content}
    </button>
  );
}
