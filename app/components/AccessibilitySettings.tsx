"use client";

import { useId } from "react";
import Link from "next/link";
import AnimatedOverlay from "./AnimatedOverlay";
import GlassCard from "./GlassCard";
import { useTheme } from "@/components/ThemeProvider";
import type { A11ySettings, TextSize } from "@/lib/a11y";

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: "100", label: "Default" },
  { value: "112", label: "Large" },
  { value: "125", label: "Larger" },
  { value: "150", label: "Largest" },
];

const TOGGLES: { key: Exclude<keyof A11ySettings, "textSize">; label: string; hint: string }[] = [
  { key: "highContrast", label: "High contrast", hint: "Darker text, stronger borders and focus outlines." },
  { key: "reduceMotion", label: "Reduce motion", hint: "Turns off animations and transitions." },
  { key: "readableFont", label: "Readable font", hint: "Switches to Atkinson Hyperlegible, designed for low vision." },
  { key: "underlineLinks", label: "Underline links", hint: "Makes every link identifiable without colour." },
  { key: "textSpacing", label: "Increase text spacing", hint: "Wider letter, word and line spacing." },
];

function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-black/10 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-semibold text-secondary cursor-pointer">
          {label}
        </label>
        <p id={`${id}-hint`} className="text-xs text-muted mt-0.5">
          {hint}
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={`${id}-hint`}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
          checked ? "bg-primary border-primary" : "bg-black/10 border-black/20"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 rounded-full bg-[#FFFFFF] shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function AccessibilitySettings({
  open,
  onClose,
  settings,
  update,
  reset,
}: {
  open: boolean;
  onClose: () => void;
  settings: A11ySettings;
  update: (patch: Partial<A11ySettings>) => void;
  reset: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const headingId = useId();

  return (
    <AnimatedOverlay open={open} onClose={onClose} labelledBy={headingId}>
      <GlassCard className="max-w-lg w-full mx-auto relative bg-white shadow-xl border-black/10 p-5 sm:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close accessibility settings"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center justify-center w-10 h-10 text-muted hover:text-secondary hover:bg-black/10 transition-colors bg-black/5 rounded-lg z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <h2 id={headingId} className="text-xl mb-1 font-orbitron text-primary font-bold pr-12">
          Accessibility settings
        </h2>
        <p className="text-xs text-muted mb-5 border-b border-black/10 pb-3">
          Saved on this device and applied to every page.
        </p>

        <fieldset className="mb-4">
          <legend className="text-sm font-semibold text-secondary mb-2">Text size</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TEXT_SIZES.map((size) => {
              const active = settings.textSize === size.value;
              return (
                <label
                  key={size.value}
                  className={`flex flex-col items-center justify-center min-h-[44px] rounded-lg border px-2 py-2 cursor-pointer transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
                    active ? "border-primary bg-primary/10 text-primary" : "border-black/20 text-secondary hover:border-primary"
                  }`}
                >
                  <input
                    type="radio"
                    name="a11y-text-size"
                    value={size.value}
                    checked={active}
                    onChange={() => update({ textSize: size.value })}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">{size.label}</span>
                  <span className="text-xs text-muted">{size.value === "112" ? "112.5" : size.value}%</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Switch
          checked={theme === "dark"}
          onChange={toggleTheme}
          label="Dark mode"
          hint="Light text on a dark background."
        />
        {TOGGLES.map((t) => (
          <Switch
            key={t.key}
            checked={settings[t.key]}
            onChange={(value) => update({ [t.key]: value })}
            label={t.label}
            hint={t.hint}
          />
        ))}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-4 border-t border-black/10">
          <Link href="/accessibility" onClick={onClose} className="text-xs text-primary font-semibold hover:underline">
            Read our accessibility statement
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 min-h-[44px] border border-black/20 hover:border-primary text-muted hover:text-primary rounded-lg text-xs uppercase tracking-wider bg-white"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[44px] bg-primary text-[#FFFFFF] rounded-lg text-xs uppercase tracking-wider font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </GlassCard>
    </AnimatedOverlay>
  );
}
