"use client";

import { useState, useEffect, useCallback } from "react";

interface AnimatedOverlayProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A modal overlay wrapper that fades in on open and fades out before unmounting.
 * The inner content also slides up slightly for a polished feel.
 */
export default function AnimatedOverlay({ open, onClose, children }: AnimatedOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

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

  const handleTransitionEnd = useCallback(() => {
    if (!visible) {
      setMounted(false);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        visible ? "bg-black/70 backdrop-blur-sm opacity-100" : "bg-black/0 backdrop-blur-none opacity-0"
      }`}
      onClick={onClose}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg transition-all duration-300 ease-out ${
          visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
