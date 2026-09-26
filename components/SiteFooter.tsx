"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useAccessibility } from "@/components/AccessibilityProvider";
import { LEGAL } from "@/lib/legal";

/**
 * Legal links, the accessibility-settings entry point and the non-affiliation
 * notice. `brand` renders it for the fixed red backdrop of the login screen.
 */
export default function SiteFooter({ variant = "default" }: { variant?: "default" | "brand" }) {
  const { user } = useAuth();
  const { openSettings } = useAccessibility();
  const brand = variant === "brand";

  const link = brand
    ? "text-paper/90 hover:text-paper underline-offset-4 hover:underline"
    : "text-muted hover:text-primary underline-offset-4 hover:underline";

  return (
    <footer
      className={`text-xs ${
        brand
          ? "mt-8 pt-4 border-t border-paper/15 text-alt-color/85 text-center"
          : "mt-12 pt-6 border-t border-black/10 text-muted"
      }`}
    >
      <nav aria-label="Legal and accessibility">
        <ul className={`flex flex-wrap items-center gap-x-4 gap-y-0 ${brand ? "justify-center" : ""}`}>
          <li><Link href="/terms" className={`inline-flex items-center min-h-[44px] ${link}`}>Terms of Use</Link></li>
          <li><Link href="/privacy" className={`inline-flex items-center min-h-[44px] ${link}`}>Privacy Policy</Link></li>
          <li><Link href="/accessibility" className={`inline-flex items-center min-h-[44px] ${link}`}>Accessibility</Link></li>
          <li>
            <button type="button" onClick={openSettings} className={`inline-flex items-center min-h-[44px] ${link}`}>
              Accessibility settings
            </button>
          </li>
          {user && (
            <li><Link href="/account" className={`inline-flex items-center min-h-[44px] ${link}`}>Your data</Link></li>
          )}
          <li><a href={`mailto:${LEGAL.contactEmail}`} className={`inline-flex items-center min-h-[44px] ${link}`}>Contact</a></li>
        </ul>
      </nav>
      <p className="mt-2 leading-relaxed">
        © {new Date().getFullYear()} {LEGAL.siteName}. An independent project — not affiliated with, endorsed by or
        sponsored by York University. Grades and GPAs shown are estimates; your official record is the one York
        University issues.
      </p>
    </footer>
  );
}
