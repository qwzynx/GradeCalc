"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LogOut } from "lucide-react";
import NeonButton from "../../components/NeonButton";
import DiagnosticMatrix from "../../components/DiagnosticMatrix";
import EditCourseForm from "../../components/EditCourseForm";
import AssignmentForm from "../../components/AssignmentForm";
import AnimatedOverlay from "../../components/AnimatedOverlay";
import GlassCard from "../../components/GlassCard";
import { Course, Assignment, BackendMetrics } from "../../types";
import { supabase } from "@/lib/supabase";
import { calculateGrades } from "@/lib/calculations";

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
  const [targetGrade, setTargetGrade] = useState<number>(80);
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  
  // Assignment input modes
  const [inputModes, setInputModes] = useState<("percentage" | "points")[]>(["percentage"]);
  const [splitQuantity, setSplitQuantity] = useState<number>(1);

  const fetchMetrics = async (target: number, currentAssignments: Assignment[]) => {
    const assignsForCalc = currentAssignments.map((a: Assignment) => ({ percentage: a.mark, weight: a.weight }));
    try {
      const metrics = calculateGrades(assignsForCalc, target) as BackendMetrics;
      setBackendMetrics(metrics);
    } catch (e) {
      console.error("Error fetching metrics", e);
    }
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setTargetGrade(isNaN(val) ? 0 : val);
    if (!isNaN(val)) {
       fetchMetrics(val, assignments);
    }
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

        // Primary: Presence of mark (marked first). Secondary: Alphabetical by name.
        const loadedAssignments = (assignData || []).sort((a, b) => {
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
    } catch (error) {
      console.error("Error updating course", error);
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
      
      router.push('/');
    } catch (error) {
      console.error("Error deleting course", error);
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
    } catch (error) {
      console.error("Error setting force grade", error);
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
    } catch (error) {
      console.error("Error removing force grade", error);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!course?.id) return;
    const formData = new FormData(e.currentTarget);
    
    const weight = formData.get("weight") as string;
    const weightValue = weight ? parseFloat(weight) : undefined;
    const baseName = formData.get("name") as string;
    
    try {
      const promises = [];
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
      };
      
      promises.push(
        supabase.from('assignments').insert([newAssignment])
      );
      
      await Promise.all(promises);
      
      setAddingAssignment(false);
      setInputModes(["percentage"]);
      setSplitQuantity(1);
      fetchCourseData();
    } catch (error) {
      console.error("Error adding assignment", error);
    }
  };

  const handleUpdateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAssignment || !editingAssignment.id) return;
    
    const formData = new FormData(e.currentTarget);
    const updatedAssignment: Partial<Assignment> = {
      name: formData.get("name") as string,
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
    } catch (error) {
      console.error("Error updating assignment", error);
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
    } catch (error) {
      console.error("Error deleting assignment", error);
    }
  };

  const { signOut } = useAuth();

  // Total weight across all assignments
  const totalAssignmentWeight = assignments.reduce((sum, a) => sum + (a.weight ?? 0), 0);

  // Calculate Graph Data safely
  const completedWeight = backendMetrics ? 100 - backendMetrics.remaining_weight : 0;
  const earnedWeight = backendMetrics && completedWeight > 0 ? (backendMetrics.final_average * completedWeight) / 100 : 0;
  const lostWeight = Math.max(0, completedWeight - earnedWeight); // Prevent negative loss from bonus points
  const remainingWeight = backendMetrics ? backendMetrics.remaining_weight : 100;
  const maxMark = earnedWeight + remainingWeight;

  const graphData = [
    { name: 'Earned Mark', value: parseFloat(earnedWeight.toFixed(2)), color: '#34d399' },
    { name: 'Lost Mark', value: parseFloat(lostWeight.toFixed(2)), color: '#ef4444' },
    { name: 'Remaining Weight', value: parseFloat(remainingWeight.toFixed(2)), color: '#f2a65a' }
  ].filter(d => d.value > 0);

  if (authLoading || loading || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
         <div className="h-16 w-16 rounded-full border-4 border-prHighlight border-t-secondary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 sm:p-10 flex flex-col">
      <header className="mb-8 border-b border-prHighlight pb-6">
        <button onClick={() => router.push('/')} className="mb-4 text-alt-color hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-wider">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          System Uplink
        </button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-orbitron tracking-widest text-transparent bg-clip-text bg-linear-to-r from-secondary to-alt-color drop-shadow-[0_0_10px_rgba(224,211,211,0.5)]">
              {course.name}
            </h1>
            <p className="mt-2 text-alt-color text-sm uppercase tracking-wider">{course.semester} {course.year} • {course.prof_name || "Unassigned"}</p>
          </div>
          <button 
            onClick={signOut}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300"
          >
            <div className="flex flex-col items-start text-right">
               <span className="text-[10px] text-alt-color/40 uppercase tracking-[0.2em] group-hover:text-red-400/60 transition-colors">Session</span>
               <span className="text-xs font-orbitron text-alt-color group-hover:text-red-400 transition-colors">Sign Out</span>
            </div>
            <LogOut className="w-4 h-4 text-alt-color group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
          </button>
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

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 max-w-screen-2xl mx-auto w-full">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Compact Metrics Box */}
          <GlassCard className="p-4 relative">
            <button
              onClick={() => setEditingCourse(true)}
              className="absolute top-3 right-3 text-alt-color hover:text-white transition-colors bg-prHighlight/20 hover:bg-prHighlight/40 p-1.5 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <h3 className="text-xs font-montserrat text-secondary uppercase tracking-[0.2em] border-b border-prHighlight/50 pb-2 mb-3">Course Parameters</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-alt-color/60 block font-montserrat">Instructor</span>
                <span className="text-secondary text-xs font-montserrat">{course.prof_name || "Unassigned"}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-alt-color/60 block font-montserrat">Category</span>
                <span className="text-secondary text-xs font-montserrat">{course.category || "—"}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-alt-color/60 block font-montserrat">Credits</span>
                <span className="text-secondary text-xs font-montserrat">{course.credits || "N/A"}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-alt-color/60 block font-montserrat">Status</span>
                <span className={`text-xs font-montserrat ${course.in_progress ? "text-emerald-400" : "text-alt-color"}`}>
                  {course.in_progress ? "● Active" : "○ Archived"}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Assignments Section — fills remaining height, scrollable */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="flex justify-between items-center border-b border-prHighlight pb-2">
              <h3 className="text-lg font-orbitron text-secondary tracking-widest">Assignments</h3>
              <button 
                onClick={() => { setAddingAssignment(true); setEditingAssignment(null); setSplitQuantity(1); }}
                className="text-xs uppercase tracking-wider transition-all flex items-center gap-1 text-alt-color hover:text-white"
              >
                <span>+ Add</span>
              </button>
            </div>

            <div className="overflow-y-auto flex flex-col gap-2 max-h-[300px] pr-1">
              {assignments.length > 0 ? (
                assignments.map(a => (
                  <div key={a.id} className="flex justify-between items-center p-3 bg-primary/30 border border-prHighlight/50 rounded-lg hover:border-secondary transition-colors group/item relative shrink-0">
                    <div className="flex flex-col">
                      <span className="text-secondary text-base font-bold">{a.name}</span>
                      <span className="text-[10px] text-alt-color uppercase tracking-wider">
                        M: {a.mark !== null && a.mark !== undefined ? <span className="text-secondary">{a.mark.toFixed(2)}%</span> : 'N/A'} • W: <span className="text-secondary">{a.weight?.toFixed(2)}%</span>
                      </span>
                    </div>
                    <button 
                      onClick={() => { setEditingAssignment(a); setAddingAssignment(false); }}
                      className="p-2 text-alt-color hover:text-white bg-prHighlight/20 rounded transition-colors shrink-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-alt-color bg-primary/20 rounded border border-prHighlight/30 outline-dashed outline-1 outline-prHighlight/50 outline-offset-[-5px]">
                  <span className="text-2xl mb-2 opacity-50 block">📂</span>
                  <p className="text-sm font-orbitron tracking-widest text-secondary opacity-70">Archive Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Advanced Calculations & Graph */}
        <div className="lg:col-span-8 flex flex-col gap-8">
           
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
             graphData={graphData}
           />

        </div>

      </main>
    </div>
  );
}

