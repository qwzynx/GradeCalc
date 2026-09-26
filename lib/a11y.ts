export type TextSize = "100" | "112" | "125" | "150";

export interface A11ySettings {
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  readableFont: boolean;
  underlineLinks: boolean;
  textSpacing: boolean;
}

export const A11Y_STORAGE_KEY = "gradematrix-a11y";

export const DEFAULT_A11Y: A11ySettings = {
  textSize: "100",
  highContrast: false,
  reduceMotion: false,
  readableFont: false,
  underlineLinks: false,
  textSpacing: false,
};

/**
 * Mirrors each setting onto <html> as a data attribute; globals.css keys the
 * actual styling off those attributes. Kept dependency-free so the same logic
 * can be inlined into the pre-paint script below.
 */
export function applyA11ySettings(s: A11ySettings, root: HTMLElement = document.documentElement) {
  const flag = (name: string, on: boolean) =>
    on ? root.setAttribute(name, "") : root.removeAttribute(name);
  root.setAttribute("data-text-size", s.textSize);
  flag("data-high-contrast", s.highContrast);
  flag("data-reduce-motion", s.reduceMotion);
  flag("data-readable-font", s.readableFont);
  flag("data-underline-links", s.underlineLinks);
  flag("data-text-spacing", s.textSpacing);
}

export function readA11ySettings(): A11ySettings {
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    return raw ? { ...DEFAULT_A11Y, ...JSON.parse(raw) } : DEFAULT_A11Y;
  } catch {
    return DEFAULT_A11Y;
  }
}

// Runs in <head> before first paint so a saved text size or contrast setting
// doesn't flash the default styling on every page load.
export const A11Y_PREPAINT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  A11Y_STORAGE_KEY
)})||"{}");var r=document.documentElement;r.setAttribute("data-text-size",s.textSize||"100");[["highContrast","data-high-contrast"],["reduceMotion","data-reduce-motion"],["readableFont","data-readable-font"],["underlineLinks","data-underline-links"],["textSpacing","data-text-spacing"]].forEach(function(p){if(s[p[0]])r.setAttribute(p[1],"")})}catch(e){}})();`;
