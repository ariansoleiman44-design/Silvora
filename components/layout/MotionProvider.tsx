"use client";

import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Loads only the animation features the site uses (~40% smaller than the
 * full `motion` bundle). All components use `m.*` instead of `motion.*`.
 *
 * The feature bundle is fetched as its own chunk rather than imported
 * eagerly, so it does not sit in the first-load JS. Until it arrives
 * `m.*` elements render as plain DOM nodes at their initial style,
 * which is what a reduced-motion visitor sees anyway.
 */
const loadFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
