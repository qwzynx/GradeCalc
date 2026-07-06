"use client";

import { useEffect, useRef, useState } from "react";
import GlassCard from "./GlassCard";
import NeonButton from "./NeonButton";
import NumberInput from "./NumberInput";
import { Course, Assignment, EclassSyncPlan, EclassSuggestedCourse, EclassPlanItem } from "../types";

interface EclassSyncProps {
  courses: Course[];
  assignments: Record<string, Assignment[]>;
  onApply: (plan: EclassSyncPlan) => Promise<{ updated: number; created: number; coursesCreated: number }>;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = ["LE/EECS", "SC/MATH", "SC/CHEM", "LE/ENG", "SC/PHYS"];
const SEMESTER_OPTIONS = ["Fall", "Winter", "Full Summer", "Summer 1", "Summer 2"];

function normalizeName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isDecrease(item: EclassPlanItem) {
  return (
    item.old_mark !== null &&
    item.old_mark !== undefined &&
    item.new_mark !== null &&
    item.new_mark < item.old_mark
  );
}

type Phase = "connect" | "waiting" | "loading" | "review" | "applying" | "done" | "error";

const popupSupported = process.env.NEXT_PUBLIC_ECLASS_POPUP_SUPPORTED === "1";

export default function EclassSync({ courses, assignments, onApply, onCancel }: EclassSyncProps) {
  const [phase, setPhase] = useState<Phase>("connect");
  const [syncId, setSyncId] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(!popupSupported);
  const [sessionCookie, setSessionCookie] = useState("");
  const [plan, setPlan] = useState<EclassSyncPlan | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [createCourse, setCreateCourse] = useState<Record<number, boolean>>({});
  const [courseEdits, setCourseEdits] = useState<Record<number, EclassSuggestedCourse>>({});
  const [attachingIdx, setAttachingIdx] = useState<number | null>(null);
  const [attachErrors, setAttachErrors] = useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [summary, setSummary] = useState<{ updated: number; created: number; coursesCreated: number } | null>(null);
  const syncIdRef = useRef<string | null>(null);
  syncIdRef.current = syncId;

  const itemKey = (ci: number, ii: number) => `${ci}-${ii}`;

  const buildCoursesPayload = () =>
    courses
      // In-progress courses (need grade updates) plus any course already linked
      // to an eClass ID (even if completed) — the AI needs to see it so it can
      // recognize it by that ID instead of drafting it as a new course again.
      .filter((c) => c.id && (c.in_progress || c.eclass_course_id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        semester: c.semester,
        year: c.year,
        eclass_course_id: c.eclass_course_id ?? null,
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
    const initialCreate: Record<number, boolean> = {};
    const initialEdits: Record<number, EclassSuggestedCourse> = {};
    fetchedPlan.courses.forEach((c, ci) => {
      c.items.forEach((_, ii) => {
        initialSelection[itemKey(ci, ii)] = true;
      });
      if (!c.app_course_id && c.suggested_course) {
        initialCreate[ci] = true;
        initialEdits[ci] = { ...c.suggested_course };
      }
    });
    setPlan(fetchedPlan);
    setSelected(initialSelection);
    setCreateCourse(initialCreate);
    setCourseEdits(initialEdits);
    setAttachErrors({});
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

  // Lets a drafted new course borrow its graded components' weights (and
  // name/term) from an actual syllabus PDF instead of the AI's eClass guess.
  // Marks carry over for components whose names still match; anything new
  // in the syllabus lands with no mark yet (to be picked up on the next sync).
  const handleAttachSyllabus = async (ci: number, file: File) => {
    setAttachingIdx(ci);
    setAttachErrors((prev) => ({ ...prev, [ci]: "" }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-syllabus", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse syllabus");
      }
      const data = await res.json();
      if (!data.course || !data.assignments) throw new Error("AI could not extract course data from this file.");

      setPlan((prev) => {
        if (!prev) return prev;
        const course = prev.courses[ci];
        const existingItems = course.items;
        const mergedItems = data.assignments.map((pa: { name: string; weight: number }) => {
          const match = existingItems.find(
            (it) =>
              normalizeName(it.assignment_name || it.eclass_item_name).includes(normalizeName(pa.name)) ||
              normalizeName(pa.name).includes(normalizeName(it.assignment_name || it.eclass_item_name))
          );
          return {
            eclass_item_name: match?.eclass_item_name || pa.name,
            action: "create" as const,
            assignment_id: null,
            assignment_name: pa.name,
            new_mark: match?.new_mark ?? null,
            old_mark: null,
            weight: pa.weight,
            warning: match ? null : "No grade found on eClass yet for this component.",
          };
        });

        const courses = prev.courses.map((c, i) => (i === ci ? { ...c, items: mergedItems } : c));
        return { ...prev, courses };
      });

      setCourseEdits((prev) => ({
        ...prev,
        [ci]: {
          name: data.course.name || prev[ci]?.name || "",
          prof_name: data.course.prof_name || null,
          semester: data.course.semester || prev[ci]?.semester || "Fall",
          year: data.course.year || prev[ci]?.year || new Date().getFullYear(),
          credits: data.course.credits ?? prev[ci]?.credits ?? 3,
          category: data.course.category ?? prev[ci]?.category ?? null,
        },
      }));

      setSelected((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (k.startsWith(`${ci}-`)) delete next[k];
        });
        data.assignments.forEach((_: unknown, ii: number) => {
          next[itemKey(ci, ii)] = true;
        });
        return next;
      });
    } catch (err: any) {
      setAttachErrors((prev) => ({ ...prev, [ci]: err.message || "Something went wrong" }));
    } finally {
      setAttachingIdx(null);
    }
  };

  const handleApply = async () => {
    if (!plan) return;
    setPhase("applying");
    try {
      const filteredPlan: EclassSyncPlan = {
        ...plan,
        courses: plan.courses
          .map((c, ci) => ({ c, ci }))
          .filter(({ c, ci }) => c.app_course_id || (createCourse[ci] && c.suggested_course))
          .map(({ c, ci }) => ({
            ...c,
            items: c.items.filter((_, ii) => selected[itemKey(ci, ii)]),
            suggested_course: c.app_course_id ? c.suggested_course : courseEdits[ci] || c.suggested_course,
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
        <h2 className="text-xl mb-4 font-orbitron text-primary font-bold border-b border-black/10 pb-2 pr-12">eClass Sync</h2>

        {popupSupported && (
          <>
            <p className="text-sm text-muted mb-5">
              A browser window will open on this computer. Sign into eClass with Passport York + Duo — once you&apos;re in, the window closes and your enrolled courses and grades are scraped automatically. New courses are drafted for you to review, and grades are matched against what&apos;s already in the app.
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
          </>
        )}

        {!popupSupported && (
          <p className="text-sm text-muted mb-5">
            Paste your eClass session cookie below — your grades are read and matched against your syllabus automatically. Nothing is stored beyond the sync results.
          </p>
        )}

        {showManual && (
          <div className={popupSupported ? "mt-3 border-t border-black/10 pt-3" : ""}>
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
              {(summary?.coursesCreated ?? 0) > 0 && (
                <><span className="text-secondary font-semibold">{summary?.coursesCreated}</span> course{(summary?.coursesCreated ?? 0) === 1 ? "" : "s"} added • </>
              )}
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
  const draftCourses = plan?.courses.filter((c) => !c.app_course_id && c.suggested_course) || [];
  const unresolvedCourses = plan?.courses.filter((c) => !c.app_course_id && !c.suggested_course) || [];
  const matchedCoursesWithChanges = matchedCourses.filter((c) => c.items.length > 0);
  const upToDateCount = matchedCourses.length - matchedCoursesWithChanges.length;
  const newCoursesToCreate = draftCourses.filter((c) => createCourse[plan!.courses.indexOf(c)]).length;
  const selectedCount = (plan?.courses || []).reduce((sum, c, ci) => {
    if (!c.app_course_id && !createCourse[ci]) return sum;
    return sum + c.items.filter((_, ii) => selected[itemKey(ci, ii)]).length;
  }, 0);
  const hasChanges = matchedCourses.some((c) => c.items.length > 0) || newCoursesToCreate > 0;

  return (
    <GlassCard className="max-w-4xl w-full max-h-[92vh] relative bg-white shadow-xl border-black/10 flex flex-col">
      {closeButton}
      <h2 className="text-xl mb-2 font-orbitron text-primary font-bold border-b border-black/10 pb-3 pr-12 shrink-0">Review Sync Plan</h2>
      <p className="text-[11px] text-muted uppercase tracking-widest mb-5 leading-relaxed shrink-0">AI-matched against your courses — uncheck anything you don&apos;t want applied</p>

      <div className="flex flex-col gap-5 flex-1 min-h-0 overflow-y-auto pr-2 mb-5">
        {!hasChanges && (
          <div className="text-center py-10 text-muted bg-black/5 rounded-xl border border-black/10">
            <p className="text-sm font-orbitron tracking-widest text-secondary opacity-70">Everything is up to date</p>
            <p className="text-xs mt-2">No new or changed grades were found on eClass.</p>
          </div>
        )}

        {matchedCoursesWithChanges.map((course, ci) => {
          const realCi = plan!.courses.indexOf(course);
          return (
            <div key={course.eclass_course_id || ci} className="border border-black/10 rounded-xl overflow-hidden">
              <div className="bg-black/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-bold text-secondary min-w-0 break-words">{course.app_course_name || course.eclass_course_name}</p>
                  <span className={`text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap ${
                    course.confidence === "high" ? "bg-emerald-500/10 text-emerald-600" :
                    course.confidence === "medium" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                  }`}>
                    {course.confidence} match
                  </span>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-muted/80 break-words mt-1.5">eClass: {course.eclass_course_name}</p>
              </div>

              <div className="flex flex-col divide-y divide-black/5">
                {course.items.map((item, ii) => {
                  const key = itemKey(realCi, ii);
                  return (
                    <label key={key} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-black/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={!!selected[key]}
                        onChange={(e) => setSelected((prev) => ({ ...prev, [key]: e.target.checked }))}
                        className="mt-1 accent-primary cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-secondary font-medium">{item.assignment_name || item.eclass_item_name}</span>
                        <p className="text-[11px] text-muted mt-1 leading-relaxed">
                          Mark: <span className="text-secondary">{item.old_mark !== null && item.old_mark !== undefined ? `${item.old_mark}%` : "N/A"}</span> → <span className={`font-bold ${isDecrease(item) ? "text-red-600" : "text-emerald-600"}`}>{item.new_mark}%</span>
                        </p>
                        {item.warning && (
                          <p className="text-[10px] text-amber-700 bg-amber-500/10 border border-amber-200 rounded-md px-2 py-1 mt-1.5 leading-snug">⚠ {item.warning}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {upToDateCount > 0 && (
          <p className="text-[11px] text-muted/80 text-center py-1">
            {upToDateCount} course{upToDateCount === 1 ? "" : "s"} already up to date
          </p>
        )}

        {draftCourses.map((course) => {
          const ci = plan!.courses.indexOf(course);
          const edit = courseEdits[ci] || course.suggested_course!;
          const enabled = !!createCourse[ci];
          return (
            <div key={course.eclass_course_id} className={`border rounded-xl overflow-hidden transition-opacity ${enabled ? "border-black/10" : "border-black/10 opacity-60"}`}>
              <div className="bg-black/5 px-4 py-3 flex flex-wrap items-start gap-3">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setCreateCourse((prev) => ({ ...prev, [ci]: e.target.checked }))}
                  className="mt-2 accent-primary cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <input
                    value={edit.name}
                    disabled={!enabled}
                    onChange={(e) => setCourseEdits((prev) => ({ ...prev, [ci]: { ...edit, name: e.target.value } }))}
                    className="w-full bg-white border border-black/20 rounded px-2.5 py-1.5 text-sm font-bold text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm disabled:opacity-50"
                  />
                  <p className="text-[9px] uppercase tracking-widest text-muted break-words mt-1.5">eClass: {course.eclass_course_name}</p>
                </div>
                <span className="text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full shrink-0 bg-primary/10 text-primary">
                  New Course
                </span>
              </div>

              <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-black/5">
                <select
                  value={edit.semester}
                  disabled={!enabled}
                  onChange={(e) => setCourseEdits((prev) => ({ ...prev, [ci]: { ...edit, semester: e.target.value } }))}
                  className="bg-white border border-black/20 rounded px-2 py-1 text-xs text-secondary focus:outline-none focus:border-primary shadow-sm disabled:opacity-50"
                >
                  {SEMESTER_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <NumberInput
                  value={edit.year}
                  disabled={!enabled}
                  onChange={(e) => setCourseEdits((prev) => ({ ...prev, [ci]: { ...edit, year: parseInt(e.target.value) || edit.year } }))}
                  className="bg-white border border-black/20 rounded px-2 py-1 text-xs text-secondary focus:outline-none focus:border-primary shadow-sm disabled:opacity-50"
                />
                <select
                  value={edit.category || ""}
                  disabled={!enabled}
                  onChange={(e) => setCourseEdits((prev) => ({ ...prev, [ci]: { ...edit, category: e.target.value || null } }))}
                  className="bg-white border border-black/20 rounded px-2 py-1 text-xs text-secondary focus:outline-none focus:border-primary shadow-sm disabled:opacity-50"
                >
                  <option value="">Unspecified</option>
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {course.items.length === 0 ? (
                <p className="px-4 py-3 text-xs text-muted">No graded components found on eClass yet.</p>
              ) : (
                <div className="flex flex-col divide-y divide-black/5">
                  {course.items.map((item, ii) => {
                    const key = itemKey(ci, ii);
                    return (
                      <label key={key} className={`flex items-start gap-3 px-4 py-3 transition-colors ${enabled ? "cursor-pointer hover:bg-black/5" : "cursor-not-allowed"}`}>
                        <input
                          type="checkbox"
                          checked={!!selected[key]}
                          disabled={!enabled}
                          onChange={(e) => setSelected((prev) => ({ ...prev, [key]: e.target.checked }))}
                          className="mt-1 accent-primary cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-secondary font-medium">{item.assignment_name || item.eclass_item_name}</span>
                            <span className="text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">New</span>
                          </div>
                          <p className="text-[11px] text-muted mt-1 leading-relaxed">
                            {item.new_mark !== null ? (
                              <>Mark: <span className="text-emerald-600 font-bold">{item.new_mark}%</span></>
                            ) : (
                              <span className="italic">No grade yet</span>
                            )}
                            {item.weight !== null && item.weight !== undefined && <> • Weight: <span className="text-secondary">{item.weight}%</span></>}
                          </p>
                          {item.warning && (
                            <p className="text-[10px] text-amber-700 bg-amber-500/10 border border-amber-200 rounded-md px-2 py-1 mt-1.5 leading-snug">⚠ {item.warning}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              <div className="px-4 py-3 flex items-center gap-2">
                <label className={`text-[10px] uppercase tracking-widest font-orbitron transition-colors ${enabled ? "text-muted hover:text-primary cursor-pointer" : "text-muted/40 cursor-not-allowed"}`}>
                  {attachingIdx === ci ? "Parsing syllabus…" : "📎 Attach syllabus PDF for exact weights"}
                  <input
                    type="file"
                    accept=".pdf"
                    disabled={!enabled || attachingIdx !== null}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAttachSyllabus(ci, f); e.target.value = ""; }}
                    className="hidden"
                  />
                </label>
              </div>
              {attachErrors[ci] && (
                <p className="px-4 pb-3 text-[10px] text-red-600">{attachErrors[ci]}</p>
              )}
            </div>
          );
        })}

        {unresolvedCourses.length > 0 && (
          <div className="bg-black/5 border border-black/10 rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-muted font-bold mb-2">Not matched to any course — skipped</p>
            <div className="flex flex-col gap-1">
              {unresolvedCourses.map((c, i) => (
                <p key={i} className="text-xs text-muted break-words">• {c.eclass_course_name}</p>
              ))}
            </div>
          </div>
        )}

        {plan && plan.warnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-200 rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-amber-700 font-bold mb-2">Syllabus Verification Warnings</p>
            <div className="flex flex-col gap-2">
              {plan.warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-amber-900 leading-relaxed flex items-start gap-1.5">
                  <span className="shrink-0">⚠</span>
                  <span>{w}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 shrink-0">
        <NeonButton onClick={handleApply} disabled={!hasChanges || (selectedCount === 0 && newCoursesToCreate === 0)} className="flex-1 py-3 text-sm">
          {newCoursesToCreate > 0
            ? `Create ${newCoursesToCreate} Course${newCoursesToCreate === 1 ? "" : "s"}${selectedCount > 0 ? ` & Apply ${selectedCount} Update${selectedCount === 1 ? "" : "s"}` : ""}`
            : `Apply ${selectedCount} Update${selectedCount === 1 ? "" : "s"}`}
        </NeonButton>
        <button onClick={handleCancel} className="px-6 py-2.5 min-h-[44px] border border-black/20 hover:border-secondary bg-white text-muted hover:text-secondary rounded text-xs uppercase tracking-wider transition-all shadow-sm">
          Cancel
        </button>
      </div>
    </GlassCard>
  );
}
