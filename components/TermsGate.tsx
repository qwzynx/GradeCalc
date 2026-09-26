"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { LEGAL, TERMS_VERSION } from "@/lib/legal";
import AnimatedOverlay from "@/app/components/AnimatedOverlay";
import GlassCard from "@/app/components/GlassCard";

// Readable without accepting: the documents themselves, and the account page
// so someone who declines can still export or delete their data.
const LEGAL_PAGES = ["/terms", "/privacy", "/accessibility", "/account"];

/**
 * Asks signed-in users to accept the current Terms and Privacy Policy when
 * their recorded acceptance (user_metadata.terms_version) is missing or older
 * than TERMS_VERSION — i.e. accounts created before the documents existed, or
 * after a material change. The legal pages themselves stay readable.
 */
export default function TermsGate() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const headingId = useId();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accepted = user?.user_metadata?.terms_version === TERMS_VERSION;
  const open = !!user && !accepted && !LEGAL_PAGES.includes(pathname);

  const accept = async () => {
    setSaving(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({
      data: { terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() },
    });
    if (error) setError(error.message);
    setSaving(false);
  };

  return (
    <AnimatedOverlay open={open} onClose={() => {}} labelledBy={headingId}>
      <GlassCard className="max-w-lg w-full mx-auto bg-white shadow-xl border-black/10 p-5 sm:p-6">
        <h2 id={headingId} className="text-xl mb-3 font-orbitron text-primary font-bold border-b border-black/10 pb-2">
          {user?.user_metadata?.terms_version ? "Our terms have changed" : "Before you continue"}
        </h2>
        <p className="text-sm text-secondary mb-3">
          Please review and accept the {LEGAL.siteName}{" "}
          <Link href="/terms" className="text-primary font-semibold underline">Terms of Use</Link> and{" "}
          <Link href="/privacy" className="text-primary font-semibold underline">Privacy Policy</Link>{" "}
          to keep using your account.
        </p>
        <p className="text-xs text-muted mb-5">
          In short: grades shown here are estimates, not official records; {LEGAL.siteName} is not affiliated
          with York University; syllabus files and synced eClass data are processed by Google&apos;s Gemini AI;
          and you can export or delete your data at any time.
        </p>
        {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            onClick={signOut}
            className="flex-1 px-4 py-2 min-h-[44px] border border-black/20 hover:border-primary text-muted hover:text-primary rounded-lg text-xs uppercase tracking-wider bg-white"
          >
            Decline &amp; sign out
          </button>
          <button
            type="button"
            onClick={accept}
            disabled={saving}
            className="flex-1 px-4 py-2 min-h-[44px] bg-primary text-[#FFFFFF] rounded-lg text-xs uppercase tracking-wider font-semibold disabled:opacity-50"
          >
            {saving ? "Saving…" : "I accept"}
          </button>
        </div>
      </GlassCard>
    </AnimatedOverlay>
  );
}
