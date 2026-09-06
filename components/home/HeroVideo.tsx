"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * HERO BACKGROUND VIDEO
 * --------------------------------------------------------------------
 * A 2.2 MB enhancement layered OVER the hero still, never in place of
 * it. The still stays the LCP element and paints exactly as fast as it
 * did before this existed; the video fades in on top only once it can
 * actually play. If it never loads, nothing is missing — the still is a
 * frame from the same shot.
 *
 * WHO DOES NOT GET IT, and why this matters here specifically: the
 * buyers this site is for are farmers and traders on rural mobile
 * connections, and the rest of the codebase is careful about that. So
 * the video is skipped entirely — never requested, not one byte — when:
 *
 *   - the viewport is small (a phone gets the still)
 *   - the visitor asked for reduced motion
 *   - the browser reports Save-Data
 *   - the connection reports itself as 2g/3g
 *
 * That is decided on the client after mount, so the server HTML never
 * contains a <video> element and nothing is fetched before we know.
 *
 * The file has no audio track at all — it was stripped during encoding,
 * rather than merely muted, so there is no way for it to make noise and
 * no bytes spent on a track nobody hears.
 */

/** Below this the still is used. Matches the `md` breakpoint. */
const MIN_WIDTH = 768;

function shouldPlayVideo(): boolean {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < MIN_WIDTH) return false;

  // Not in every browser; absence is treated as "no objection".
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  if (connection?.saveData) return false;
  if (connection?.effectiveType && /(^|-)[23]g$/.test(connection.effectiveType)) return false;

  return true;
}

/*
 * Read once, on the client only.
 *
 * useSyncExternalStore rather than an effect that calls setState: the
 * server snapshot is `false`, so the rendered HTML never contains a
 * <video> and nothing is requested before the decision is made. The
 * subscribe function is intentionally a no-op — the answer is not
 * re-evaluated on resize, because starting a 2.2 MB download because
 * someone widened a window is not something they asked for.
 */
const noopSubscribe = () => () => {};

export function HeroVideo({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  const supported = useSyncExternalStore(noopSubscribe, shouldPlayVideo, () => false);
  const enabled = supported && !reduce;

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video) return;

    // Some browsers refuse autoplay even muted. That rejects a promise
    // rather than throwing, and an unhandled rejection in the console
    // is noise — the still is already showing, so there is nothing to
    // recover from.
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => setReady(false));
  }, [enabled]);

  if (!enabled) return null;

  return (
    <video
      ref={videoRef}
      // No `poster`: the optimised <Image> underneath is the poster, and
      // a poster attribute here would download the same frame twice.
      autoPlay
      muted
      loop
      playsInline
      // The still carries the meaning; this is decoration.
      aria-hidden
      tabIndex={-1}
      preload="auto"
      onCanPlay={() => setReady(true)}
      className={cn(
        "absolute inset-0 h-full w-full object-cover object-[62%_50%] md:object-[50%_50%]",
        "transition-opacity duration-1000 ease-out",
        ready ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <source src="/media/hero-bales.mp4" type="video/mp4" />
    </video>
  );
}
