"use client";

import { useSyncExternalStore } from "react";
import { m, useReducedMotion } from "framer-motion";

/**
 * Soft page transition on route changes.
 *
 * THE FIRST PAINT IS NEVER ANIMATED, and that is the whole point of the
 * machinery below.
 *
 * This used to render `initial={{ opacity: 0 }}` unconditionally, which
 * Framer serialises into the server HTML. The built page really did
 * contain:
 *
 *   <main id="content"><div style="opacity:0;transform:translateY(8px)">
 *
 * So every page shipped with everything below the header invisible. The
 * hero could not paint — and therefore could not be the LCP element —
 * until the JavaScript downloaded, React hydrated, LazyMotion fetched
 * its feature chunk on a *further* round trip, and a 550ms fade ran.
 * Preloading the hero, dropping 390 KB of fonts and preconnecting to the
 * image origin could not help while the paint itself was gated on JS.
 * With JS blocked or broken, the page stayed blank below the header
 * permanently.
 *
 * `useSyncExternalStore` answers "has anything mounted yet?" — false on
 * the server and on the very first client render, true afterwards. So
 * the first page a visitor lands on renders as plain, immediately
 * visible HTML, and only subsequent client-side navigations fade in.
 */

let hasMounted = false;

function subscribe(onChange: () => void) {
  // One-shot: after the first mount the answer never changes again.
  if (!hasMounted) {
    hasMounted = true;
    // Deferred so the flag flips *after* the first paint, not during it.
    const id = setTimeout(onChange, 0);
    return () => clearTimeout(id);
  }
  return () => {};
}

const getSnapshot = () => hasMounted;
const getServerSnapshot = () => false;

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (reduce) return <>{children}</>;

  return (
    <m.div
      // `false` means "start where you are" — no opacity:0 in the HTML.
      initial={mounted ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </m.div>
  );
}
