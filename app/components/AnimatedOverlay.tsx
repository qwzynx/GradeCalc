"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type OverlayWidth = "lg" | "2xl" | "4xl";

interface AnimatedOverlayProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max width of the panel. Defaults to `lg`. */
  width?: OverlayWidth;
  /** id of the element that names the dialog (usually its heading). */
  labelledBy?: string;
  /** Accessible name when there's no visible heading to point at. */
  label?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const WIDTHS: Record<OverlayWidth, string> = {
  lg: "max-w-lg",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
};

// Nested/stacked overlays must not fight over the body scroll lock, so track
// how many are open and only release when the last one closes.
let openOverlays = 0;

function lockBodyScroll() {
  openOverlays += 1;
  document.body.classList.add("overlay-open");
}

function unlockBodyScroll() {
  openOverlays = Math.max(0, openOverlays - 1);
  if (openOverlays === 0) document.body.classList.remove("overlay-open");
}

/**
 * A modal overlay wrapper that fades in on open and fades out before unmounting.
 * The inner content also slides up slightly for a polished feel.
 *
 * Device notes: the backdrop scrolls (rather than centring content that can't
 * be reached), the page behind is locked so touch scrolling stays inside the
 * modal, Escape closes it, and heights use dvh so mobile browser chrome doesn't
 * clip the panel.
 *
 * Focus (WCAG 2.4.3): opening moves focus into the panel, Tab cycles within
 * it, and closing returns focus to whatever opened the dialog.
 */
export default function AnimatedOverlay({ open, onClose, children, width = "lg", labelledBy, label }: AnimatedOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Trigger the "visible" class on the next frame so the CSS transition fires
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      // Start fade-out
      setVisible(false);
    }
  }, [open]);

  // Hold the scroll lock for as long as the overlay occupies the screen —
  // including the fade-out, so the page doesn't jump before it's gone.
  useEffect(() => {
    if (!mounted) return;
    lockBodyScroll();
    return unlockBodyScroll;
  }, [mounted]);

  // Move focus into the panel once it's on screen, and hand it back to the
  // trigger when the overlay unmounts.
  useEffect(() => {
    if (!mounted) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel || panel.contains(document.activeElement)) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    });
    return () => {
      cancelAnimationFrame(frame);
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const inside = panelRef.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleTransitionEnd = useCallback(() => {
    if (!visible) {
      setMounted(false);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain overlay-safe transition-all duration-300 ease-out ${
        visible ? "bg-black/70 backdrop-blur-sm opacity-100" : "bg-black/0 backdrop-blur-none opacity-0"
      }`}
      onClick={onClose}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* min-h-full + my-auto centres short panels but lets tall ones scroll
          from the top instead of overflowing past the edges of the screen. */}
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div
          ref={panelRef}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className={`w-full outline-none ${WIDTHS[width]} my-auto transition-all duration-300 ease-out ${
            visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
