"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Theme toggle + sign out, shared by the dashboard and course headers.
 *
 * Both pages render two instances — an icon-only one that sits beside the page
 * title on compact layouts, and a labelled one that joins the toolbar row at
 * lg. Visibility is left to the caller so each header can place them itself.
 */
export default function HeaderControls({ showLabel = false }: { showLabel?: boolean }) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <button
        onClick={toggleTheme}
        className="group flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-sm border border-black/10 hover:border-primary transition-all duration-300"
        aria-label="Toggle Theme"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
        ) : (
          <Moon className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
        )}
      </button>
      <button
        onClick={signOut}
        aria-label="Sign Out"
        className={`group flex items-center justify-center gap-2 h-11 rounded-xl bg-white shadow-sm border border-black/10 hover:border-red-600 hover:bg-primary/10 transition-all duration-300 ${
          showLabel ? "px-4" : "w-11"
        }`}
      >
        {showLabel && (
          <span className="text-xs font-orbitron font-semibold text-secondary group-hover:text-red-600 transition-colors uppercase tracking-wider">
            Sign Out
          </span>
        )}
        <LogOut className="w-4 h-4 text-muted group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
      </button>
    </>
  );
}
