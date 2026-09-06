"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { LogoSymbol } from "@/components/ui/Logo";
import { useDict } from "@/lib/locale-client";
import { useCopy } from "@/lib/locale-client";
import type { Application, BaleFormat, OrderType, Product } from "@/types/product";
import { cn } from "@/lib/utils";

type SortKey = "recommended" | "size-desc" | "size-asc" | "order-type";

interface Filters {
  format: BaleFormat[];
  application: Application[];
  orderType: OrderType[];
}

const formatOptions: BaleFormat[] = ["round", "square", "compact"];
const applicationOptions: Application[] = ["dairy", "beef", "sheep-goats", "general"];
const orderTypeOptions: OrderType[] = ["small-farm", "commercial", "bulk", "export"];
const orderRank: Record<OrderType, number> = { "small-farm": 0, commercial: 1, bulk: 2, export: 3 };

const empty: Filters = { format: [], application: [], orderType: [] };

function parseParam<T extends string>(value: string | null, allowed: T[]): T[] {
  if (!value) return [];
  return value.split(",").filter((v): v is T => allowed.includes(v as T));
}

export function ProductCatalog({ products }: { products: Product[] }) {
  const copy = useCopy();
  const { format: formatLabels, application: applicationLabels, orderType: orderTypeLabels } = useDict().labels;
  const t = copy.products;
  const params = useSearchParams();
  const reduce = useReducedMotion();

  const [filters, setFilters] = useState<Filters>(() => ({
    format: parseParam(params.get("format"), formatOptions),
    application: parseParam(params.get("application"), applicationOptions),
    orderType: parseParam(params.get("order"), orderTypeOptions),
  }));
  const [sort, setSort] = useState<SortKey>("recommended");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keep the URL shareable without triggering a navigation.
  useEffect(() => {
    const sp = new URLSearchParams();
    if (filters.format.length) sp.set("format", filters.format.join(","));
    if (filters.application.length) sp.set("application", filters.application.join(","));
    if (filters.orderType.length) sp.set("order", filters.orderType.join(","));
    const qs = sp.toString();
    const next = qs ? `/products?${qs}` : "/products";
    if (window.location.pathname + window.location.search !== next) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [filters]);

  const toggle = <K extends keyof Filters>(key: K, value: Filters[K][number]) =>
    setFilters((f) => {
      const list = f[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });

  const activeCount = filters.format.length + filters.application.length + filters.orderType.length;

  const visible = useMemo(() => {
    const filtered = products.filter((p) => {
      if (filters.format.length && !filters.format.includes(p.format)) return false;
      if (filters.application.length && !p.application.some((a) => filters.application.includes(a))) return false;
      if (filters.orderType.length && !p.orderType.some((o) => filters.orderType.includes(o))) return false;
      return true;
    });
    const sorted = [...filtered];
    switch (sort) {
      case "size-desc":
        sorted.sort((a, b) => (b.approxWeightKg ?? 0) - (a.approxWeightKg ?? 0));
        break;
      case "size-asc":
        sorted.sort((a, b) => (a.approxWeightKg || Infinity) - (b.approxWeightKg || Infinity));
        break;
      case "order-type":
        sorted.sort(
          (a, b) =>
            Math.min(...a.orderType.map((o) => orderRank[o])) - Math.min(...b.orderType.map((o) => orderRank[o])),
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [products, filters, sort]);

  const filterGroups = (
    <div className="space-y-8">
      <FilterGroup
        title={t.groups.format}
        options={formatOptions.map((v) => ({ value: v, label: formatLabels[v] }))}
        selected={filters.format}
        onToggle={(v) => toggle("format", v as BaleFormat)}
      />
      <FilterGroup
        title={t.groups.application}
        options={applicationOptions.map((v) => ({ value: v, label: applicationLabels[v] }))}
        selected={filters.application}
        onToggle={(v) => toggle("application", v as Application)}
      />
      <FilterGroup
        title={t.groups.orderType}
        options={orderTypeOptions.map((v) => ({ value: v, label: orderTypeLabels[v] }))}
        selected={filters.orderType}
        onToggle={(v) => toggle("orderType", v as OrderType)}
      />
      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => setFilters(empty)}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-ink/60 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          {t.clear}
        </button>
      )}
    </div>
  );

  return (
    <div className="container-x">
      {/* Toolbar */}
      <div className="sticky top-16 z-30 -mx-[var(--gutter)] border-b border-ink/10 bg-cream/90 px-[var(--gutter)] py-3 backdrop-blur-xl md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 md:border-b md:border-ink/10 md:pb-6">
          <p className="mono-num text-sm text-ink/60" aria-live="polite">
            <span className="font-display text-2xl text-ink">{visible.length}</span>{" "}
            {visible.length === 1 ? t.result : t.results}
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-ink/60">
              <span className="hidden sm:inline">{t.sort}</span>
              <span className="relative">
                <select
                  aria-label={t.sort}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="select-reset w-[9.5rem] cursor-pointer truncate rounded-[2px] border border-ink/20 bg-transparent py-2.5 pe-8 ps-3 text-xs uppercase tracking-[0.12em] text-ink sm:w-auto"
                >
                  {t.sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal className="pointer-events-none absolute end-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60" strokeWidth={1.5} aria-hidden />
              </span>
            </label>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-[2px] border border-ink/20 px-3 text-xs uppercase tracking-[0.12em] lg:hidden"
              aria-haspopup="dialog"
            >
              {t.filters}
              {activeCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.625rem] text-cream">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-28">
            <h2 className="eyebrow mb-6 text-ink/60">{t.filters}</h2>
            {filterGroups}
          </div>
        </aside>

        {/* Grid */}
        <div className="lg:col-span-9">
          {visible.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center border border-dashed border-ink/20 p-10 text-center">
              <LogoSymbol tone="dark" ribColor="#f5f1e7" className="h-12 w-12 opacity-30" />
              <p className="display-sm mt-6">{t.empty[0]}</p>
              <p className="mt-2 max-w-sm text-sm text-ink/60">{t.empty[1]}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button variant="ink" size="sm" icon="none" onClick={() => setFilters(empty)}>
                  {t.emptyCta}
                </Button>
                <Button href="/products/bulk-custom-order" variant="outline-dark" size="sm">
                  {t.emptySecondary}
                </Button>
              </div>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-x-6 gap-y-12 xs:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {visible.map((p, i) => (
                  <m.li
                    key={p.id}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ProductCard product={p} index={i} priority={i < 2} headingLevel={2} />
                  </m.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t.filters}
        footer={
          <Button variant="ink" full icon="none" onClick={() => setDrawerOpen(false)}>
            {t.apply} ({visible.length})
          </Button>
        }
      >
        {filterGroups}
      </Drawer>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="eyebrow mb-4 text-ink/60">{title}</legend>
      <ul className="space-y-1">
        {options.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <li key={o.value}>
              <label className="group flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(o.value)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "grid h-4.5 w-4.5 place-items-center border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold",
                    checked ? "border-ink bg-ink" : "border-ink/30 group-hover:border-ink",
                  )}
                  aria-hidden
                >
                  <span className={cn("h-1.5 w-1.5 bg-cream transition-transform", checked ? "scale-100" : "scale-0")} />
                </span>
                <span className={cn(checked ? "text-ink" : "text-ink/70 group-hover:text-ink")}>{o.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
