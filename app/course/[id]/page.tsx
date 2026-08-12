"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import HeaderControls from "../../components/HeaderControls";
import DiagnosticMatrix from "../../components/DiagnosticMatrix";
import EditCourseForm from "../../components/EditCourseForm";
import AssignmentForm from "../../components/AssignmentForm";
import AnimatedOverlay from "../../components/AnimatedOverlay";
import GlassCard from "../../components/GlassCard";
import { Course, Assignment, BackendMetrics } from "../../types";
import { supabase } from "@/lib/supabase";
import { calculateGrades } from "@/lib/calculations";

// Postgres "undefined_column" — the only way to hit it here is the is_bonus
// migration not having been run yet, which deserves a fixable message rather
// than a generic "try again".
const assignmentErrorMessage = (error: unknown, fallback: string) =>
  (error as { code?: string } | null)?.code === "42703"
    ? "Bonus marks need a database update — run the 20260808_assignment_bonus migration in Supabase."
    : fallback;

export default function CourseDetail() {
  const { id } = useParams();
  const router = useRouter();
  const courseId = id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [backendMetrics, setBackendMetrics] = useState<BackendMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [editingCourse, setEditingCourse] = useState(false);
  const [forceGradeOpen, setForceGradeOpen] = useState(false);
  const [addingAssignment, setAddingAssignment] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [targetGrade, setTargetGrade] = useState<string>("80");
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const userId = user?.id;
  
  // Assignment input modes
  const [inputModes, setInputModes] = useState<("percentage" | "points")[]>(["percentage"]);
  const [splitQuantity, setSplitQuantity] = useState<number>(1);

  const fetchMetrics = async (target: string | number, currentAssignments: Assignment[]) => {
    const assignsForCalc = currentAssignments.map((a: Assignment) => ({ percentage: a.mark, weight: a.weight, is_bonus: a.is_bonus }));
    try {
      const metrics = calculateGrades(assignsForCalc, target) as BackendMetrics;
      setBackendMetrics(metrics);
    } catch (e) {
      console.error("Error fetching metrics", e);
    }
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTargetGrade(val);
    fetchMetrics(val, assignments);
  };

  const fetchCourseData = async () => {
    try {
      if (!courseId || !userId) return;
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const fullCourse = data[0];
        setCourse(fullCourse);
        
        // Fetch assignments separately with proper ordering
        const { data: assignData, error: assignError } = await supabase
          .from('assignments')
          .select('*')
          .eq('course_id', courseId)
          .order('created_at', { ascending: true });

        if (assignError) throw assignError;

        // Primary: Bonuses last (they're extras, not part of the 100%).
        // Secondary: Presence of mark (marked first). Tertiary: Alphabetical by name.
        const loadedAssignments = (assignData || []).sort((a, b) => {
          if (!!a.is_bonus !== !!b.is_bonus) {
            return a.is_bonus ? 1 : -1;
          }

          const aHasMark = a.mark !== null && a.mark !== undefined;
          const bHasMark = b.mark !== null && b.mark !== undefined;

          if (aHasMark !== bHasMark) {
            return aHasMark ? -1 : 1; // Marked assignments first
          }

          // Both have marks or both are null: sort alphabetically
          return a.name.localeCompare(b.name);
        });
        setAssignments(loadedAssignments);

        // Perform calculations locally
        await fetchMetrics(targetGrade, loadedAssignments);
      } else {
        router.push('/');
        return;
      }

    } catch (error) {
      console.error("Error fetching course data", error);
      showToast("Could not load this course. Check your connection and refresh.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCourseData();
    }
  }, [courseId, userId]);

  const handleUpdateCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!course?.id) return;
    
    const formData = new FormData(e.currentTarget);
    const updatedCourse: Partial<Course> = {
      name: formData.get("name") as string,
      year: parseInt(formData.get("year") as string) || new Date().getFullYear(),
      semester: formData.get("semester") as string || "Fall",
      in_progress: formData.get("in_progress") === "on",
    };

    const profName = formData.get("prof_name") as string;
    updatedCourse.prof_name = profName || undefined;
    
    const category = formData.get("category") as string;
    updatedCourse.category = category || undefined;

    const credits = formData.get("credits") as string;
    if (credits) updatedCourse.credits = parseFloat(credits);

    try {
      const { error } = await supabase
        .from('courses')
        .update(updatedCourse)
        .eq('id', course.id)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      setEditingCourse(false);
      fetchCourseData();
      showToast("Course updated");
    } catch (error) {
      console.error("Error updating course", error);
      showToast("Could not update the course. Please try again.", "error");
    }
  };

  const handleDeleteCourse = async () => {
    if (!course?.id) return;
    if (!window.confirm("Are you sure you want to permanently delete this course?")) return;
    
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id)
        .eq('user_id', userId);
        
      if (error) throw error;

      showToast("Course deleted");
      router.push('/');
    } catch (error) {
      console.error("Error deleting course", error);
      showToast("Could not delete the course. Please try again.", "error");
    }
  };

  const handleForceGradeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!course?.id) return;
    
    const formData = new FormData(e.currentTarget);
    const markValue = parseFloat(formData.get("force_mark") as string);

    try {
      const { error } = await supabase
        .from('courses')
        .update({ mark: markValue })
        .eq('id', course.id)
        .eq('user_id', userId);
        
      if (error) throw error;
        
      setForceGradeOpen(false);
      fetchCourseData();
      showToast(`Grade override set to ${markValue}%`);
    } catch (error) {
      console.error("Error setting force grade", error);
      showToast("Could not set the grade override. Please try again.", "error");
    }
  };

  const handleRemoveForceGrade = async () => {
    if (!course?.id) return;
    try {
      const { error } = await supabase
        .from('courses')
        .update({ mark: null })
        .eq('id', course.id)
        .eq('user_id', userId);
        
      if (error) throw error;
        
      setForceGradeOpen(false);
      fetchCourseData();
      showToast("Grade override removed");
    } catch (error) {
      console.error("Error removing force grade", error);
      showToast("Could not remove the grade override. Please try again.", "error");
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!course?.id) return;
    const formData = new FormData(e.currentTarget);
    
    const weight = formData.get("weight") as string;
    const weightValue = weight ? parseFloat(weight) : undefined;
    const baseName = formData.get("name") as string;
    const isBonus = formData.get("is_bonus") === "1";

    try {
      const isSplitGroup = splitQuantity > 1;
      
      let sumPercentages = 0;
      let validMarksCount = 0;
      let totalEarnedPoints = 0;
      let totalMaxPoints = 0;
      
      let allPointsBased = true; // Track if we can do a global points sum

      for (let i = 0; i < splitQuantity; i++) {
        const mode = inputModes[i] || "percentage";
        
        if (mode === "percentage") {
          allPointsBased = false;
          const markPercentage = formData.get(isSplitGroup ? `mark_${i}` : "mark") as string;
          if (markPercentage) {
            sumPercentages += parseFloat(markPercentage);
            validMarksCount++;
          }
        } else {
          const pointsEarned = formData.get(isSplitGroup ? `points_earned_${i}` : "points_earned") as string;
          const pointsTotal = formData.get(isSplitGroup ? `points_total_${i}` : "points_total") as string;
          
          if (pointsEarned && pointsTotal) {
            const earned = parseFloat(pointsEarned);
            const total = parseFloat(pointsTotal);
            if (total > 0) {
              totalEarnedPoints += earned;
              totalMaxPoints += total;
              
              const localPercentage = (earned / total) * 100;
              sumPercentages += localPercentage;
              validMarksCount++;
            }
          }
        }
      }

      let finalCalculatedMark: number | null = null;

      if (validMarksCount > 0) {
         if (allPointsBased && totalMaxPoints > 0) {
            // Strictly points based, so sum up (Earned / Total) collectively
            finalCalculatedMark = parseFloat(((totalEarnedPoints / totalMaxPoints) * 100).toFixed(2));
         } else {
            // Mixed or all percentages: Average the valid percentages directly
            finalCalculatedMark = parseFloat((sumPercentages / validMarksCount).toFixed(2));
         }
      }
      
      const newAssignment: Partial<Assignment> = {
        course_id: course.id,
        name: isSplitGroup ? `${baseName} (Group Average)` : baseName,
        mark: finalCalculatedMark,
        weight: weightValue, // Do NOT split the weight
        is_bonus: isBonus,
      };

      const { error } = await supabase.from('assignments').insert([newAssignment]);
      if (error) throw error;

      setAddingAssignment(false);
      setInputModes(["percentage"]);
      setSplitQuantity(1);
      fetchCourseData();
      showToast(`Added ${baseName}`);
    } catch (error) {
      console.error("Error adding assignment", error);
      showToast(assignmentErrorMessage(error, "Could not add the assignment. Please try again."), "error");
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAssignment || !editingAssignment.id) return;
    
    const formData = new FormData(e.currentTarget);
    const updatedAssignment: Partial<Assignment> = {
      name: formData.get("name") as string,
      is_bonus: formData.get("is_bonus") === "1",
    };

    const mode = inputModes[0] || "percentage";
    if (mode === "percentage") {
      const mark = formData.get("mark") as string;
      updatedAssignment.mark = mark !== "" ? parseFloat(mark) : null;
    } else {
      const pointsEarned = formData.get("points_earned") as string;
      const pointsTotal = formData.get("points_total") as string;
      if (pointsEarned && pointsTotal) {
        const earned = parseFloat(pointsEarned);
        const total = parseFloat(pointsTotal);
        if (total > 0) {
          updatedAssignment.mark = parseFloat(((earned / total) * 100).toFixed(2));
        }
      } else {
        updatedAssignment.mark = null;
      }
    }

    const weight = formData.get("weight") as string;
    updatedAssignment.weight = weight ? parseFloat(weight) : undefined;

    try {
      const { error } = await supabase
        .from('assignments')
        .update(updatedAssignment)
        .eq('id', editingAssignment.id);
        
      if (error) throw error;
        
      setEditingAssignment(null);
      fetchCourseData();
      showToast("Assignment updated");
    } catch (error) {
      console.error("Error updating assignment", error);
      showToast(assignmentErrorMessage(error, "Could not update the assignment. Please try again."), "error");
    }
  };

  const handleDeleteAssignment = async (assignment: Assignment) => {
    if (!assignment.id) return;
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;
    
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id);
        
      if (error) throw error;
        
      setEditingAssignment(null);
      fetchCourseData();
      showToast(`Deleted ${assignment.name}`);
    } catch (error) {
      console.error("Error deleting assignment", error);
      showToast("Could not delete the assignment. Please try again.", "error");
    }
  };

  // Total weight of the graded scheme — bonuses sit outside the 100%
  const totalAssignmentWeight = assignments.reduce((sum, a) => sum + (a.is_bonus ? 0 : a.weight ?? 0), 0);
  const totalBonusWeight = assignments.reduce((sum, a) => sum + (a.is_bonus ? a.weight ?? 0 : 0), 0);

  // Calculate Graph Data safely
  const bonusPoints = backendMetrics?.bonus_points ?? 0;
  const bonusPotential = backendMetrics?.bonus_potential ?? 0;
  const completedWeight = backendMetrics ? 100 - backendMetrics.remaining_weight : 0;
  // Strip the bonus back out: the slices below describe the 100% scale only,
  // with whatever bonus was earned shown as its own slice on top.
  const baseAverage = backendMetrics ? backendMetrics.final_average - bonusPoints : 0;
  const earnedWeight = completedWeight > 0 ? (baseAverage * completedWeight) / 100 : 0;
  const lostWeight = Math.max(0, completedWeight - earnedWeight); // Prevent negative loss from bonus points
  const remainingWeight = backendMetrics ? backendMetrics.remaining_weight : 100;
  const maxMark = earnedWeight + remainingWeight + bonusPotential;

  const graphData = [
    { name: 'Earned Mark', value: parseFloat(earnedWeight.toFixed(2)), color: '#34d399' },
    { name: 'Lost Mark', value: parseFloat(lostWeight.toFixed(2)), color: '#ef4444' },
    { name: 'Remaining Weight', value: parseFloat(remainingWeight.toFixed(2)), color: '#f2a65a' },
    { name: 'Bonus', value: parseFloat(bonusPoints.toFixed(2)), color: '#8b5cf6' }
  ].filter(d => d.value > 0);


  if (authLoading || loading || !course) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
         <div className="h-16 w-16 rounded-full border-4 border-black/10 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh app-shell mx-auto w-full max-w-screen-2xl flex flex-col">
      {/* Below lg: [back] + system controls on one row, the course title on its
          own line so long names get the full width. Single row at lg. */}
      <header className="mb-6 sm:mb-8 border-b border-black/10 pb-5 sm:pb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.push('/')}
              className="group flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-black/5 hover:bg-black/10 text-muted hover:text-secondary transition-all text-[10px] uppercase tracking-widest font-orbitron border border-transparent hover:border-black/10 min-h-[44px] shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
              Back to Dashboard
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <HeaderControls />
            </div>
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-orbitron tracking-wide sm:tracking-widest text-transparent bg-clip-text bg-linear-to-r from-secondary to-primary drop-shadow-[0_0_10px_rgba(224,211,211,0.5)] leading-tight break-words">
              {course.name}
            </h1>
            <p className="mt-1 text-muted text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-orbitron break-words">{course.semester} {course.year} • {course.prof_name || "Unassigned"}</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-end gap-3 shrink-0">
          <HeaderControls showLabel />
        </div>
      </header>

      {/* Overlay: Edit Course Form */}
      <AnimatedOverlay open={editingCourse} onClose={() => setEditingCourse(false)}>
        <EditCourseForm
          course={course}
          onSubmit={handleUpdateCourse}
          onCancel={() => setEditingCourse(false)}
          onDelete={handleDeleteCourse}
        />
      </AnimatedOverlay>

      {/* Overlay: Add / Edit Assignment Form */}
      <AnimatedOverlay open={addingAssignment || !!editingAssignment} onClose={() => { setAddingAssignment(false); setEditingAssignment(null); }}>
        <AssignmentForm
          editingAssignment={editingAssignment}
          onSubmit={(e) => editingAssignment ? handleUpdateAssignment(e) : handleSubmitAssignment(e)}
          onDelete={handleDeleteAssignment}
          splitQuantity={splitQuantity}
          setSplitQuantity={setSplitQuantity}
          inputModes={inputModes}
          setInputModes={setInputModes}
          currentTotalWeight={totalAssignmentWeight}
        />
      </AnimatedOverlay>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start flex-1 w-full">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 w-full flex flex-col gap-4 order-2 lg:order-1">

          {/* Compact Metrics Box */}
          <GlassCard className="p-4 relative">
            <button
              onClick={() => setEditingCourse(true)}
              aria-label="Edit course"
              className="absolute top-2 right-2 flex items-center justify-center w-9 h-9 text-muted hover:text-secondary transition-colors bg-black/5 hover:bg-black/10 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <h3 className="text-xs font-montserrat text-secondary uppercase tracking-[0.2em] border-b border-black/10 pb-2 mb-3">Course Parameters</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-muted/60 block font-montserrat">Instructor</span>
                <span className="text-secondary text-xs font-montserrat">{course.prof_name || "Unassigned"}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-muted/60 block font-montserrat">Category</span>
                <span className="text-secondary text-xs font-montserrat">{course.category || "—"}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-muted/60 block font-montserrat">Credits</span>
                <span className="text-secondary text-xs font-montserrat">{course.credits || "N/A"}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-muted/60 block font-montserrat">Status</span>
                <span className={`text-xs font-montserrat ${course.in_progress ? "text-emerald-400" : "text-muted"}`}>
                  {course.in_progress ? "● Active" : "○ Archived"}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Assignments Section — fills remaining height, scrollable */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-black/10 pb-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                <h3 className="text-lg font-orbitron text-secondary tracking-widest">Assignments</h3>
                {assignments.length > 0 && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider tabular-nums shrink-0 ${
                      totalAssignmentWeight > 100
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                        : totalAssignmentWeight === 100
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-black/5 border-black/10 text-muted'
                    }`}
                    title={totalAssignmentWeight > 100 ? "Total weight exceeds 100% — the extra counts as bonus" : "Total weight of all assignments"}
                  >
                    {parseFloat(totalAssignmentWeight.toFixed(2))}% of 100% weighted
                  </span>
                )}
                {totalBonusWeight > 0 && (
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider tabular-nums shrink-0 bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-400"
                    title="Bonus available on top of the 100%"
                  >
                    +{parseFloat(totalBonusWeight.toFixed(2))}% bonus
                  </span>
                )}
              </div>
              <button
                onClick={() => { setAddingAssignment(true); setEditingAssignment(null); setSplitQuantity(1); }}
                className="text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 px-3 py-2 min-h-[40px] rounded-lg text-muted hover:text-primary bg-black/5 hover:bg-primary/10 border border-transparent hover:border-primary/30 shrink-0"
              >
                <span>+ Add</span>
              </button>
            </div>

            {/* Caps at a comfortable slice of the viewport on phones rather
                than a fixed pixel height that can exceed a short screen. */}
            <div className="overflow-y-auto overscroll-contain flex flex-col gap-2 max-h-[60dvh] lg:max-h-[420px] pr-1">
              {assignments.length > 0 ? (
                assignments.map(a => {
                  const hasMark = a.mark !== null && a.mark !== undefined;
                  const markTheme = !hasMark
                    ? "bg-black/5 text-muted border-black/10"
                    : a.mark! >= 80
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : a.mark! >= 70
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                        : a.mark! >= 50
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
                  return (
                    <div key={a.id} className={`flex justify-between items-center gap-3 p-3 bg-surface/70 border rounded-xl shadow-sm hover:border-black/15 backdrop-blur-lg backdrop-filter transition-all hover:shadow-md group/item relative shrink-0 ${a.is_bonus ? 'border-violet-500/30' : 'border-surface'}`}>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-secondary text-base font-bold truncate" title={a.name}>{a.name}</span>
                          {a.is_bonus && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400 font-bold uppercase tracking-wider shrink-0">
                              Bonus
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted uppercase tracking-wider">
                          {a.is_bonus ? 'Worth up to' : 'Weight'}: <span className={a.is_bonus ? 'text-violet-700 dark:text-violet-400' : 'text-secondary'}>{a.weight !== null && a.weight !== undefined ? `${a.is_bonus ? '+' : ''}${parseFloat(a.weight.toFixed(2))}%` : '—'}</span>
                          {a.is_bonus && a.mark !== null && a.mark !== undefined && (
                            <span className="text-muted"> · adds {parseFloat((((a.weight ?? 0) * a.mark) / 100).toFixed(2))}%</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`min-w-[60px] sm:min-w-[64px] text-center text-xs font-bold font-orbitron tabular-nums px-2 py-2 rounded-lg border ${markTheme}`}>
                          {hasMark ? `${parseFloat(a.mark!.toFixed(2))}%` : 'Pending'}
                        </span>
                        <button
                          onClick={() => { setEditingAssignment(a); setAddingAssignment(false); }}
                          className="flex items-center justify-center w-10 h-10 shrink-0 text-muted hover:text-secondary bg-black/5 hover:bg-black/10 rounded-lg transition-colors"
                          aria-label={`Edit ${a.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted bg-surface/50 rounded-xl border border-black/10 outline-dashed outline-1 outline-black/20 outline-offset-[-5px] shadow-sm flex flex-col items-center gap-3">
                  <p className="text-sm font-orbitron tracking-widest text-secondary opacity-70">No assignments yet</p>
                  <button
                    onClick={() => { setAddingAssignment(true); setEditingAssignment(null); setSplitQuantity(1); }}
                    className="text-[10px] uppercase tracking-widest font-bold text-primary border border-primary/30 rounded-lg px-3 py-2 hover:bg-primary/10 transition-colors"
                  >
                    + Add your first assignment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Advanced Calculations & Graph.
            Leads on phones — the summary matters more than the parameter list. */}
        <div className="lg:col-span-8 w-full min-w-0 flex flex-col gap-8 order-1 lg:order-2">
           
           <DiagnosticMatrix
             course={course}
             backendMetrics={backendMetrics}
             targetGrade={targetGrade}
             handleTargetChange={handleTargetChange}
             forceGradeOpen={forceGradeOpen}
             setForceGradeOpen={setForceGradeOpen}
             handleForceGradeSubmit={handleForceGradeSubmit}
             handleRemoveForceGrade={handleRemoveForceGrade}
             completedWeight={completedWeight}
             earnedWeight={earnedWeight}
             lostWeight={lostWeight}
             remainingWeight={remainingWeight}
             maxMark={maxMark}
             bonusPoints={bonusPoints}
             bonusPotential={bonusPotential}
             graphData={graphData}
           />

        </div>

      </main>
    </div>
  );
}

