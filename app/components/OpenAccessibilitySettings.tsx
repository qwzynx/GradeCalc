"use client";

import { Accessibility } from "lucide-react";
import { useAccessibility } from "@/components/AccessibilityProvider";

export default function OpenAccessibilitySettings() {
  const { openSettings } = useAccessibility();
  return (
    <button
      type="button"
      onClick={openSettings}
      className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-primary text-[#FFFFFF] text-sm font-semibold shadow-md"
    >
      <Accessibility className="w-4 h-4" aria-hidden="true" />
      Open accessibility settings
    </button>
  );
}
