"use client";

import { useEffect, useRef, useState } from "react";
import GlassCard from "./GlassCard";
import NeonButton from "./NeonButton";
import { Course, Assignment, EclassSyncPlan } from "../types";

interface EclassSyncProps {
  courses: Course[];
  assignments: Record<string, Assignment[]>;
  onApply: (plan: EclassSyncPlan) => Promise<{ updated: number; created: number }>;
  onCancel: () => void;
}

type Phase = "connect" | "waiting" | "loading" | "review" | "applying" | "done" | "error";

export default function EclassSync({ courses, assignments, onApply, onCancel }: EclassSyncProps) {
  const [phase, setPhase] = useState<Phase>("connect");
  const [syncId, setSyncId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [sessionCookie, setSessionCookie] = useState("");
  const [plan, setPlan] = useState<EclassSyncPlan | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState<{ updated: number; created: number } | null>(null);
  const syncIdRef = useRef<string | null>(null);
  syncIdRef.current = syncId;

  const itemKey = (ci: number, ii: number) => `${ci}-${ii}`;

  const buildCoursesPayload = () =>
    courses
      .filter((c) => c.in_progress && c.id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        semester: c.semester,
        year: c.year,
        assignments: (assignments[c.id!] || []).map((a) => ({
          id: a.id,
          name: a.name,
          weight: a.weight ?? null,
          mark: a.mark ?? null,
          eclass_item_name: a.eclass_item_name ?? null,
        })),
      }));

  const receivePlan = (fetchedPlan: EclassSyncPlan) => {
    const initialSelection: Record<string, boolean> = {};
    fetchedPlan.courses.forEach((c, ci) =>
      c.items.forEach((_, ii) => {
        initialSelection[itemKey(ci, ii)] = true;
      })
    );
    setPlan(fetchedPlan);
    setSelected(initialSelection);
    setPhase("review");
  };

  // Popup flow: server opens a Chromium window for Passport York + Duo login,
  // then scrapes on its own. We just poll for progress.
  const handleStartPopup = async () => {
    setPhase("waiting");
    try {
      const res = await fetch("/api/eclass-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", courses: buildCoursesPayload() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Could not open the eClass login window");
      }
      const data = await res.json();
      setSyncId(data.syncId);
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong");
      setPhase("error");
    }
  };

  useEffect(() => {
    if (!syncId || (phase !== "waiting" && phase !== "loading")) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/eclass-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status", syncId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sync failed");

        if (data.status === "scraping") {
          setPhase("loading");
        } else if (data.status === "done") {
          setSyncId(null);
          receivePlan(data.plan);
        } else if (data.status === "error") {
          throw new Error(data.error || "Sync failed");
        }
      } catch (err: any) {
        setSyncId(null);
        setErrorMessage(err.message || "Something went wrong");
        setPhase("error");
      }
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncId, phase]);

  const cancelJob = () => {
    if (syncIdRef.current) {
      fetch("/api/eclass-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", syncId: syncIdRef.current }),
      }).catch(() => {});
      setSyncId(null);
    }
  };

  // Close the server-side browser window if the modal unmounts mid-login
  useEffect(() => cancelJob, []);

  const handleCancel = () => {
    cancelJob();
    onCancel();
  };

  // Manual fallback: user pastes their MoodleSession cookie
  const handleManualFetch = async () => {
    setPhase("loading");
    try {
      const res = await fetch("/api/eclass-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "manual", session: sessionCookie, courses: buildCoursesPayload() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to sync with eClass");
      }
      const data = await res.json();
      receivePlan(data.plan);
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong");
      setPhase("error");
    }
  };

  const handleApply = async () => {
    if (!plan) return;
    setPhase("applying");
    try {
      const filteredPlan: EclassSyncPlan = {
        ...plan,
        courses: plan.courses.map((c, ci) => ({
          ...c,
          items: c.items.filter((_, ii) => selected[itemKey(ci, ii)]),
        })),
      };
      const result = await onApply(filteredPlan);
      setSummary(result);
      setPhase("done");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to apply updates");
      setPhase("error");
    }
  };

  const closeButton = (
    <button type="button" onClick={handleCancel} className="absolute top-4 right-4 text-muted hover:text-secondary hover:bg-black/10 transition-colors bg-black/5 p-2 rounded z-20">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  );

  // --- Connect Phase ---
  if (phase === "connect") {
    return (
      <GlassCard className="max-w-lg w-full relative bg-white shadow-xl border-black/10">
        {closeButton}
        <h2 className="text-xl mb-4 font-orbitron text-primary font-bold border-b border-black/10 pb-2 pr-12">eClass Grade Sync</h2>
        <p className="text-sm text-muted mb-5">
          A browser window will open on this computer. Sign into eClass with Passport York + Duo — once you&apos;re in, the window closes and your grades are scraped and matched against your syllabus automatically.
        </p>

        <NeonButton onClick={handleStartPopup} className="w-full py-3 text-sm mb-3">
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            Open eClass Login
          </span>
        </NeonButton>
        <p className="text-[10px] text-muted mb-4">Your credentials go directly to York — this app only reads your grades, and nothing is stored beyond the sync results.</p>

        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="text-[10px] uppercase tracking-widest text-muted hover:text-primary transition-colors font-orbitron"
        >
          {showManual ? "▾" : "▸"} Trouble with the popup? Paste a session cookie instead
        </button>

        {showManual && (
          <div className="mt-3 border-t border-black/10 pt-3">
            <ol className="list-decimal list-inside flex flex-col gap-1.5 text-xs text-secondary mb-3 bg-black/5 border border-black/10 rounded-lg p-3">
              <li>
                Sign into <a href="https://eclass.yorku.ca/my/" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">eclass.yorku.ca</a> in another tab.
              </li>
              <li>Press <span className="font-mono bg-black/10 px-1 rounded">F12</span> → <span className="font-semibold">Application</span> (Chrome) / <span className="font-semibold">Storage</span> (Firefox) → Cookies.</li>
              <li>Copy the value of <span className="font-mono bg-black/10 px-1 rounded">MoodleSession</span> and paste it below.</li>
            </ol>
            <div className="flex gap-2">
              <input
                value={sessionCookie}
                onChange={(e) => setSessionCookie(e.target.value)}
                placeholder="MoodleSession value"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-white border border-black/20 rounded px-3 py-2 text-sm font-mono text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm transition-all"
              />
              <button
                onClick={handleManualFetch}
                disabled={!sessionCookie.trim()}
                className="px-4 py-2 border border-black/20 hover:border-primary text-muted hover:text-primary rounded text-xs uppercase tracking-wider transition-all shadow-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Fetch
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    );
  }

  // --- Waiting for Login Phase ---
  if (phase === "waiting") {
    return (
      <GlassCard className="max-w-lg w-full text-center py-12 bg-white shadow-xl border-black/10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-black/10 border-t-primary animate-spin" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>
          <div>
            <p className="text-primary font-orbitron tracking-wider text-sm font-bold">Waiting for eClass Login</p>
            <p className="text-muted text-xs mt-2 font-montserrat max-w-sm mx-auto">
              Complete <span className="text-secondary font-semibold">Passport York + Duo</span> in the browser window that just opened. Grades will sync automatically once you&apos;re signed in.
            </p>
          </div>
          <button onClick={handleCancel} className="mt-2 px-5 py-2.5 min-h-[44px] border border-black/20 text-muted hover:text-secondary hover:bg-black/5 rounded text-xs uppercase tracking-wider transition-all bg-white shadow-sm">
            Cancel
          </button>
        </div>
      </GlassCard>
    );
  }

  // --- Loading / Applying Phase ---
  if (phase === "loading" || phase === "applying") {
    return (
      <GlassCard className="max-w-lg w-full text-center py-12 bg-white shadow-xl border-black/10">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-black/10 border-t-primary animate-spin"></div>
            <div className="absolute inset-0 h-14 w-14 rounded-full border-4 border-transparent border-b-primary animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div>
            <p className="text-primary font-orbitron tracking-wider text-sm font-bold">
              {phase === "loading" ? "Syncing with eClass" : "Applying Updates"}
            </p>
            <p className="text-muted text-xs mt-1 font-montserrat">
              {phase === "loading" ? "Scraping grade reports & verifying against your syllabus with AI" : "Saving grade changes"}
            </p>
          </div>
          <div className="flex gap-1 mt-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </GlassCard>
    );
  }

  // --- Error Phase ---
  if (phase === "error") {
    return (
      <GlassCard className="max-w-lg w-full bg-white shadow-xl border-black/10">
        {closeButton}
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-2 border-red-200 flex items-center justify-center bg-primary/5 dark:bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
              <circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>
            </svg>
          </div>
          <div>
            <p className="text-red-600 font-orbitron font-bold tracking-wider text-sm">Sync Failed</p>
            <p className="text-muted text-xs mt-2 max-w-sm">{errorMessage}</p>
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => { setPhase("connect"); setErrorMessage(""); }} className="px-5 py-2.5 min-h-[44px] border border-black/20 hover:border-primary text-muted hover:text-primary rounded text-xs uppercase tracking-wider transition-all shadow-sm bg-white">
              Try Again
            </button>
            <button onClick={handleCancel} className="px-5 py-2.5 min-h-[44px] border border-black/20 text-muted hover:text-secondary hover:bg-black/5 rounded text-xs uppercase tracking-wider transition-all bg-white shadow-sm">
              Cancel
            </button>
          </div>
        </div>
      </GlassCard>
    );
  }

  // --- Done Phase ---
  if (phase === "done") {
    return (
      <GlassCard className="max-w-lg w-full bg-white shadow-xl border-black/10">
        {closeButton}
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-2 border-emerald-200 flex items-center justify-center bg-emerald-500/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </div>
          <div>
            <p className="text-emerald-600 font-orbitron font-bold tracking-wider text-sm">Sync Complete</p>
            <p className="text-muted text-xs mt-2">
              <span className="text-secondary font-semibold">{summary?.updated ?? 0}</span> grade{(summary?.updated ?? 0) === 1 ? "" : "s"} updated •{" "}
              <span className="text-secondary font-semibold">{summary?.created ?? 0}</span> new assignment{(summary?.created ?? 0) === 1 ? "" : "s"} added
            </p>
          </div>
          <NeonButton onClick={handleCancel} className="px-8 py-2.5 text-sm mt-2">
            Done
          </NeonButton>
        </div>
      </GlassCard>
    );
  }

  // --- Review Phase ---
  const matchedCourses = plan?.courses.filter((c) => c.app_course_id) || [];
  const unmatchedCourses = plan?.courses.filter((c) => !c.app_course_id) || [];
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const hasChanges = matchedCourses.some((c) => c.items.length > 0);

  return (
    <GlassCard className="max-w-2xl w-full relative bg-white shadow-xl border-black/10">
      {closeButton}
      <h2 className="text-xl mb-1 font-orbitron text-primary font-bold border-b border-black/10 pb-2 pr-12">Review Grade Updates</h2>
      <p className="text-[10px] text-muted uppercase tracking-widest mb-4">AI-matched against your syllabus — uncheck anything you don&apos;t want applied</p>

      <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1 mb-4">
        {!hasChanges && (
          <div className="text-center py-8 text-muted bg-black/5 rounded-xl border border-black/10">
            <p className="text-sm font-orbitron tracking-widest text-secondary opacity-70">Everything is up to date</p>
            <p className="text-xs mt-1">No new or changed grades were found on eClass.</p>
          </div>
        )}

        {matchedCourses.map((course, ci) => {
          const realCi = plan!.courses.indexOf(course);
          return (
            <div key={course.eclass_course_id || ci} className="border border-black/10 rounded-xl overflow-hidden">
              <div className="bg-black/5 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-secondary truncate">{course.app_course_name || course.eclass_course_name}</p>
                  <p className="text-[9px] uppercase tracking-widest text-muted truncate">eClass: {course.eclass_course_name}</p>
                </div>
                <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  course.confidence === "high" ? "bg-emerald-500/10 text-emerald-600" :
                  course.confidence === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                }`}>
                  {course.confidence} match
                </span>
              </div>

              {course.items.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted">No grade changes for this course.</p>
              ) : (
                <div className="flex flex-col divide-y divide-black/5">
                  {course.items.map((item, ii) => {
                    const key = itemKey(realCi, ii);
                    return (
                      <label key={key} className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-black/5 transition-colors">
                        <input
                          type="checkbox"
                          checked={!!selected[key]}
                          onChange={(e) => setSelected((prev) => ({ ...prev, [key]: e.target.checked }))}
                          className="mt-1 accent-primary cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-secondary font-medium">{item.assignment_name || item.eclass_item_name}</span>
                            <span className={`text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${
                              item.action === "create" ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600"
                            }`}>
                              {item.action === "create" ? "New" : "Update"}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted mt-0.5">
                            {item.action === "update" && (
                              <>Mark: <span className="text-secondary">{item.old_mark !== null && item.old_mark !== undefined ? `${item.old_mark}%` : "N/A"}</span> → <span className="text-emerald-600 font-bold">{item.new_mark}%</span></>
                            )}
                            {item.action === "create" && (
                              <>Mark: <span className="text-emerald-600 font-bold">{item.new_mark}%</span>{item.weight !== null && item.weight !== undefined && <> • Weight: <span className="text-secondary">{item.weight}%</span></>}</>
                            )}
                          </p>
                          {item.warning && (
                            <p className="text-[10px] text-amber-700 bg-amber-500/10 border border-amber-200 rounded px-1.5 py-0.5 mt-1 inline-block">⚠ {item.warning}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {unmatchedCourses.length > 0 && (
          <div className="bg-black/5 border border-black/10 rounded-xl p-3">
            <p className="text-[9px] uppercase tracking-widest text-muted font-bold mb-1">Not matched to any course — skipped</p>
            {unmatchedCourses.map((c, i) => (
              <p key={i} className="text-xs text-muted truncate">• {c.eclass_course_name}</p>
            ))}
            <p className="text-[10px] text-muted mt-2 opacity-70">Import the syllabus for these courses first, then sync again.</p>
          </div>
        )}

        {plan && plan.warnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-200 rounded-xl p-3 flex flex-col gap-1">
            <p className="text-[9px] uppercase tracking-widest text-amber-700 font-bold">Syllabus Verification Warnings</p>
            {plan.warnings.map((w, i) => (
              <p key={i} className="text-[11px] text-amber-900">⚠ {w}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <NeonButton onClick={handleApply} disabled={!hasChanges || selectedCount === 0} className="flex-1 py-3 text-sm">
          Apply {selectedCount} Update{selectedCount === 1 ? "" : "s"}
        </NeonButton>
        <button onClick={handleCancel} className="px-6 py-2.5 min-h-[44px] border border-black/20 hover:border-secondary bg-white text-muted hover:text-secondary rounded text-xs uppercase tracking-wider transition-all shadow-sm">
          Cancel
        </button>
      </div>
    </GlassCard>
  );
}
