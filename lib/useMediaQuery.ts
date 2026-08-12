"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query from JS. Use it only for things CSS can't
 * express — chart geometry, tick counts, prop-driven layout switches. Anything
 * that can be a Tailwind breakpoint class should stay in CSS so it's correct
 * during SSR and before hydration.
 *
 * The server snapshot is always `false`, so the server and the hydrating client
 * render identical markup; React swaps in the real value right after hydration.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

const neverChanges = () => () => {};

/**
 * False during SSR and the hydrating render, true from the next render on.
 *
 * Gate anything that must not see a media query flip underneath it. Recharts
 * in particular restarts (and can drop) its entrance animation when props
 * change mid-flight, so its charts are mounted only once `useMediaQuery` has
 * settled on the real value.
 */
export const useIsHydrated = () => useSyncExternalStore(neverChanges, () => true, () => false);

/** True below the Tailwind `sm` breakpoint — phones in portrait. */
export const useIsMobile = () => useMediaQuery("(max-width: 639px)");

/** True on devices whose primary input is touch (no precise hover). */
export const useIsTouch = () => useMediaQuery("(hover: none)");
