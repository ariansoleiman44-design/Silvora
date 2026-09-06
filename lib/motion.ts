"use client";

import {
  transform,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";

/**
 * Maps a scroll progress MotionValue to an output range, updated on the
 * JavaScript thread. `useTransform` alone lets Framer offload opacity to a
 * native ScrollTimeline whose range does not always match a sticky
 * container, so scroll-linked opacity is kept in JS deliberately.
 */
export function useScrollMapped(
  progress: MotionValue<number>,
  input: number[],
  output: number[],
): MotionValue<number> {
  const mapper = transform(input, output);
  const value = useMotionValue(mapper(progress.get()));
  useMotionValueEvent(progress, "change", (v) => value.set(mapper(v)));
  return value;
}
