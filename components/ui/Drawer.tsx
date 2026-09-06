"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCopy } from "@/lib/locale-client";
import { useIsTablet } from "@/lib/hooks";

/**
 * Accessible slide-over. Right sheet on desktop, bottom sheet on mobile
 * (or full-screen when `mobile="full"`). Handles Escape, focus trap,
 * focus restore and backdrop click.
 */

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tone?: "light" | "dark";
  side?: "end" | "start";
  mobile?: "sheet" | "full";
  widthClassName?: string;
  labelledBy?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  tone = "light",
  side = "end",
  mobile = "sheet",
  widthClassName = "md:max-w-[30rem]",
}: DrawerProps) {
  const copy = useCopy();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastActive = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    lastActive.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel) {
        const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (n) => n.offsetParent !== null,
        );
        if (nodes.length === 0) return;
        const firstNode = nodes[0]!;
        const lastNode = nodes[nodes.length - 1]!;
        if (e.shiftKey && document.activeElement === firstNode) {
          e.preventDefault();
          lastNode.focus();
        } else if (!e.shiftKey && document.activeElement === lastNode) {
          e.preventDefault();
          firstNode.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastActive.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  const isDark = tone === "dark";
  const isFull = mobile === "full";
  const isTablet = useIsTablet();

  const hidden = isTablet
    ? { x: side === "end" ? "100%" : "-100%", y: 0 }
    : { x: 0, y: "100%" };

  return (
    <AnimatePresence>
      {open && (
        <>
          <m.button
            type="button"
            aria-label={copy.common.close}
            className="fixed inset-0 z-[70] bg-ink/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={onClose}
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            tabIndex={-1}
            className={cn(
              "fixed z-[80] flex flex-col outline-none",
              isDark ? "bg-ink text-cream" : "bg-cream text-ink",
              // mobile
              isFull
                ? "inset-0"
                : "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[4px]",
              // desktop
              "md:inset-y-0 md:bottom-auto md:max-h-none md:rounded-none md:w-full",
              side === "end" ? "md:start-auto md:end-0" : "md:end-auto md:start-0",
              widthClassName,
            )}
            initial={reduce ? false : hidden}
            animate={{ y: 0, x: 0 }}
            exit={reduce ? undefined : hidden}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-4 border-b px-5 py-4 md:px-7 md:py-5",
                isDark ? "border-cream/12" : "border-ink/10",
              )}
            >
              <h2 className="display-xs">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={copy.common.close}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-full border transition-colors",
                  isDark
                    ? "border-cream/20 hover:bg-cream/10"
                    : "border-ink/15 hover:bg-ink/5",
                )}
              >
                <X className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-7">
              {children}
            </div>
            {footer && (
              <div
                className={cn(
                  "border-t px-5 py-4 pb-safe md:px-7 md:py-5",
                  isDark ? "border-cream/12" : "border-ink/10",
                )}
              >
                <div className="pb-[max(0px,env(safe-area-inset-bottom))]">{footer}</div>
              </div>
            )}
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
