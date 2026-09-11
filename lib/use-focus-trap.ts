"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * FOCUS TRAP FOR A MODAL SURFACE
 * --------------------------------------------------------------------
 * Anything that renders over the page and claims `aria-modal` owes the
 * keyboard three things, and the site was only doing the first in one
 * place and none of them in two others:
 *
 *   1. move focus INTO the surface when it opens
 *   2. keep Tab and Shift+Tab inside it while it is open
 *   3. put focus back where it came from when it closes
 *
 * Without (2) a keyboard or screen-reader user Tabs straight out of the
 * "dialog" into the page behind it — which is still there, still
 * focusable, and now hidden behind a backdrop they cannot see past.
 * Without (3) they are dumped at the top of the document and have to
 * find their place again.
 *
 * `onClose` is held in a ref on purpose. Callers pass inline arrows and
 * memo-derived callbacks that change identity on every render; with it
 * in the dependency array the effect tore itself down mid-interaction,
 * and the cleanup — which restores focus — fired while the surface was
 * still open. That was a real blocker: it made a multi-digit quantity
 * impossible to type into the quote basket.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  options: { autoFocus?: boolean } = {},
): void {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const autoFocus = options.autoFocus ?? true;

  useEffect(() => {
    if (!open) return;

    const lastActive = document.activeElement as HTMLElement | null;
    const container = containerRef.current;

    if (autoFocus) {
      const first = container?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? container)?.focus({ preventScroll: true });
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !container) return;

      // Recomputed per keypress: the contents change as the user types
      // in a search box or adds a line to the basket.
      const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
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
      } else if (!container.contains(document.activeElement)) {
        // Focus escaped some other way — bring it back.
        e.preventDefault();
        firstNode.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lastActive?.focus?.({ preventScroll: true });
    };
    // `open` only — see the note on onCloseRef above.
  }, [open, containerRef, autoFocus]);
}
