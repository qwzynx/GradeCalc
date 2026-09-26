"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, History, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import SiteFooter from "@/components/SiteFooter";
import { supabase } from "@/lib/supabase";
import { LEGAL, formatLegalDate } from "@/lib/legal";

const CONFIRM_WORD = "DELETE";

/**
 * Self-service privacy controls: download everything we hold as JSON, clear
 * the eClass sync history, or permanently delete the account.
 */
export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<"export" | "history" | "delete" | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (loading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="h-16 w-16 rounded-full border-4 border-black/10 border-t-primary animate-spin" role="status" aria-label="Loading" />
      </div>
    );
  }

  const handleExport = async () => {
    setBusy("export");
    setError(null);
    try {
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user.id);
      if (coursesError) throw coursesError;

      const courseIds = (courses || []).map((c) => c.id);
      const { data: assignments, error: assignmentsError } = courseIds.length
        ? await supabase.from("assignments").select("*").in("course_id", courseIds)
        : { data: [], error: null };
      if (assignmentsError) throw assignmentsError;

      // Missing if the eclass_syncs migration was never run — export the rest.
      const { data: syncs } = await supabase.from("eclass_syncs").select("*").eq("user_id", user.id);

      const exportData = {
        exported_at: new Date().toISOString(),
        service: LEGAL.siteName,
        account: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          terms_version: user.user_metadata?.terms_version ?? null,
          terms_accepted_at: user.user_metadata?.terms_accepted_at ?? null,
        },
        courses: courses || [],
        assignments: assignments || [],
        eclass_syncs: syncs || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gradematrix-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Your data export has been downloaded.", "success");
    } catch (e) {
      setError((e as { message?: string })?.message || "Could not export your data.");
    } finally {
      setBusy(null);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Delete your eClass sync history? Your courses and grades are not affected.")) return;
    setBusy("history");
    setError(null);
    const { error } = await supabase.from("eclass_syncs").delete().eq("user_id", user.id);
    if (error) setError(error.message);
    else showToast("eClass sync history deleted.", "success");
    setBusy(null);
  };

  const handleDelete = async () => {
    setBusy("delete");
    setError(null);
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      setError(
        `Your account could not be deleted (${error.message}). Please try again or email ${LEGAL.contactEmail} and we'll delete it for you.`
      );
      setBusy(null);
      return;
    }
    // The user no longer exists server-side, so only clear the local session.
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/login");
  };

  const acceptedAt = user.user_metadata?.terms_accepted_at as string | undefined;

  return (
    <div className="min-h-dvh app-shell mx-auto w-full max-w-3xl flex flex-col">
      <header className="mb-8 border-b border-black/10 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 min-h-[44px] text-xs uppercase tracking-widest text-muted hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
          Back to dashboard
        </Link>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-secondary">Your data</h1>
        <p className="mt-2 text-sm text-muted">
          Signed in as <span className="text-secondary font-semibold">{user.email}</span>
          {acceptedAt && <> · Terms accepted {formatLegalDate(acceptedAt.slice(0, 10))}</>}
        </p>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 flex flex-col gap-5 outline-none">
        {error && (
          <p role="alert" className="rounded-xl border border-red-600/40 bg-red-600/10 p-4 text-sm text-secondary">
            {error}
          </p>
        )}

        <section aria-labelledby="export-heading" className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
          <h2 id="export-heading" className="flex items-center gap-2 text-lg font-bold text-secondary">
            <Download className="w-5 h-5 text-primary" aria-hidden="true" /> Download your data
          </h2>
          <p className="mt-2 mb-4 text-sm text-muted">
            A JSON file with your account details, every course and assignment, and your eClass sync history.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={busy !== null}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-primary text-[#FFFFFF] text-sm font-semibold disabled:opacity-50"
          >
            {busy === "export" ? "Preparing…" : "Download my data"}
          </button>
        </section>

        <section aria-labelledby="history-heading" className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
          <h2 id="history-heading" className="flex items-center gap-2 text-lg font-bold text-secondary">
            <History className="w-5 h-5 text-primary" aria-hidden="true" /> eClass sync history
          </h2>
          <p className="mt-2 mb-4 text-sm text-muted">
            Each applied sync keeps a snapshot of the courses and grades read from eClass. Deleting the history
            doesn&apos;t change your courses or grades.
          </p>
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={busy !== null}
            className="min-h-[44px] px-5 py-2 rounded-xl border border-black/20 hover:border-primary text-secondary hover:text-primary text-sm font-semibold bg-white disabled:opacity-50"
          >
            {busy === "history" ? "Deleting…" : "Delete sync history"}
          </button>
        </section>

        <section aria-labelledby="delete-heading" className="rounded-2xl border border-red-600/40 bg-white p-5 sm:p-6">
          <h2 id="delete-heading" className="flex items-center gap-2 text-lg font-bold text-red-600">
            <Trash2 className="w-5 h-5" aria-hidden="true" /> Delete account
          </h2>
          <p className="mt-2 mb-4 text-sm text-muted">
            Permanently deletes your account, courses, assignments and sync history. This can&apos;t be undone —
            download your data first if you want a copy. Residual copies in database backups expire within about
            30 days.
          </p>
          <label htmlFor="confirm-delete" className="block text-sm text-secondary mb-2">
            Type <strong>{CONFIRM_WORD}</strong> to confirm
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 min-w-0 bg-white border border-black/20 rounded-lg px-3 py-2 min-h-[44px] text-sm text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_WORD || busy !== null}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-red-600 text-[#FFFFFF] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy === "delete" ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </section>

        <p className="text-sm text-muted">
          Want to know more, or make a request we don&apos;t offer here? See the{" "}
          <Link href="/privacy#rights" className="text-primary font-semibold underline">Privacy Policy</Link>{" "}
          or email{" "}
          <a href={`mailto:${LEGAL.contactEmail}`} className="text-primary font-semibold underline">{LEGAL.contactEmail}</a>.
          You can also <button type="button" onClick={signOut} className="text-primary font-semibold underline">sign out</button>.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
