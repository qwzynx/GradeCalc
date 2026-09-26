"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import {
  A11ySettings,
  A11Y_STORAGE_KEY,
  DEFAULT_A11Y,
  applyA11ySettings,
  readA11ySettings,
} from "@/lib/a11y";
import AccessibilitySettings from "@/app/components/AccessibilitySettings";

interface AccessibilityContextType {
  settings: A11ySettings;
  update: (patch: Partial<A11ySettings>) => void;
  reset: () => void;
  openSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

/**
 * Holds the viewer's accessibility preferences, persists them to localStorage
 * and owns the settings dialog, so any page can open it via openSettings().
 */
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  // Reading storage during the first client render is safe here: nothing this
  // state drives is in the server-rendered DOM (the dialog mounts closed, and
  // the pre-paint script has already applied the data attributes).
  const [settings, setSettings] = useState<A11ySettings>(() =>
    typeof window === "undefined" ? DEFAULT_A11Y : readA11ySettings()
  );
  const [open, setOpen] = useState(false);
  // Latest settings, so back-to-back updates in one tick merge instead of
  // each patching the same stale snapshot.
  const latest = useRef(settings);

  const commit = useCallback((next: A11ySettings) => {
    latest.current = next;
    setSettings(next);
    applyA11ySettings(next);
    try {
      localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage blocked (private mode) — settings still apply for this visit
    }
  }, []);

  const update = useCallback(
    (patch: Partial<A11ySettings>) => commit({ ...latest.current, ...patch }),
    [commit]
  );
  const reset = useCallback(() => commit(DEFAULT_A11Y), [commit]);
  const openSettings = useCallback(() => setOpen(true), []);

  return (
    <AccessibilityContext.Provider value={{ settings, update, reset, openSettings }}>
      {/* "user" already honours the OS reduced-motion setting; the in-app
          toggle forces it on for framer-motion regardless of the OS. */}
      <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "user"}>
        {children}
        <AccessibilitySettings
          open={open}
          onClose={() => setOpen(false)}
          settings={settings}
          update={update}
          reset={reset}
        />
      </MotionConfig>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
