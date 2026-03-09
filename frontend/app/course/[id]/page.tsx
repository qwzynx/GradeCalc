"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import NeonButton from "../../components/NeonButton";
import GlassCard from "../../components/GlassCard";

interface Assignment {
  id?: string;
  course_id: string;
  name: string;
  mark?: number;
  weight?: number;
}

interface Course {
  id?: string;
  user_id?: string;
  name: string;
  prof_name?: string;
  credits?: number;
  mark?: number;
  in_progress?: boolean;
  year: number;
  semester: string;
  category?: string;
}

interface BackendMetrics {
  final_average: number;
  remaining_weight: number;
  get_fifty: number | string;
  target_required_score: number | string;
  yorku_gpa: number;
  yorku_letter: string;
  higher_target_score: number | string;
  lower_target_score: number | string;
}

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
  
  // Assignment input modes
  const [inputModes, setInputModes] = useState<("percentage" | "points")[]>(["percentage"]);
  const [splitQuantity, setSplitQuantity] = useState<number>(1);
  
  const TEST_USER_ID = "00b2d4c5-c95a-46ed-8c39-a7d154a8cb66";

  const fetchMetrics = async (target: number, currentAssignments: Assignment[]) => {
    const assignsForCalc = currentAssignments.map((a: Assignment) => ({ percentage: a.mark, weight: a.weight }));
    try {
      const cRes = await fetch("http://localhost:8000/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments: assignsForCalc, target_grade: target })
      });
      const cData = await cRes.json();
      setBackendMetrics(cData);
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
      if (!courseId) return;
      const res = await fetch(`http://localhost:8000/api/courses/${courseId}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setCourse(data[0]);
      } else {
        router.push('/');
        return;
      }

      const aRes = await fetch(`http://localhost:8000/api/courses/${courseId}/assignments`);
      const aData = await aRes.json();
      const loadedAssignments = aData || [];
      setAssignments(loadedAssignments);

      // Fetch Calculations from Python Backend
      await fetchMetrics(targetGrade, loadedAssignments);

    } catch (error) {
      console.error("Error fetching course data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

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
      await fetch(`http://localhost:8000/api/courses/${course.id}?user_id=${TEST_USER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCourse),
      });
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
      await fetch(`http://localhost:8000/api/courses/${course.id}?user_id=${TEST_USER_ID}`, {
        method: "DELETE"
      });
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
      await fetch(`http://localhost:8000/api/courses/${course.id}?user_id=${TEST_USER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark: markValue }),
      });
      setForceGradeOpen(false);
      fetchCourseData();
    } catch (error) {
      console.error("Error setting force grade", error);
    }
  };

  const handleRemoveForceGrade = async () => {
    if (!course?.id) return;
    try {
      await fetch(`http://localhost:8000/api/courses/${course.id}?user_id=${TEST_USER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark: null }),
      });
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

      let finalCalculatedMark: number | undefined = undefined;

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
        fetch("http://localhost:8000/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAssignment),
        })
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
      updatedAssignment.mark = mark ? parseFloat(mark) : undefined;
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
        updatedAssignment.mark = undefined;
      }
    }

    const weight = formData.get("weight") as string;
    updatedAssignment.weight = weight ? parseFloat(weight) : undefined;

    try {
      await fetch(`http://localhost:8000/api/assignments/${editingAssignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAssignment),
      });
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
      await fetch(`http://localhost:8000/api/assignments/${assignment.id}`, {
        method: "DELETE"
      });
      setEditingAssignment(null);
      fetchCourseData();
    } catch (error) {
      console.error("Error deleting assignment", error);
    }
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen p-8 sm:p-20 flex justify-center items-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-prHighlight border-t-secondary animate-spin"></div>
          <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-b-secondary animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen p-8 sm:p-16 flex flex-col">
      <header className="mb-8 border-b border-prHighlight pb-6">
        <button onClick={() => router.push('/')} className="mb-4 text-alt-color hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-wider">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          System Uplink
        </button>
        <h1 className="text-4xl font-bold font-orbitron tracking-widest text-transparent bg-clip-text bg-linear-to-r from-secondary to-alt-color drop-shadow-[0_0_10px_rgba(224,211,211,0.5)]">
          {course.name}
        </h1>
        <p className="mt-2 text-alt-color text-sm uppercase tracking-wider">{course.semester} {course.year} • {course.prof_name || "Unassigned"}</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1 max-w-screen-2xl mx-auto w-full">
        
        {/* LEFT COLUMN: Course Parameter Information & Assignments */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {editingCourse ? (
             <GlassCard className="form-card relative z-10 w-full border-secondary shadow-[0_0_30px_rgba(242,166,90,0.15)]">
               <div className="flex justify-between items-center border-b border-prHighlight pb-2 mb-4">
                 <h2 className="text-xl font-orbitron text-secondary">Modify Parameters</h2>
                 <button onClick={() => setEditingCourse(false)} className="text-alt-color hover:text-white transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                 </button>
               </div>
               <form onSubmit={handleUpdateCourse} className="flex flex-col gap-4">
                 <div>
                   <label className="block text-[10px] uppercase tracking-wider text-alt-color mb-1">Designation</label>
                   <input required name="name" type="text" defaultValue={course.name} className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                 </div>
                 <div className="flex gap-4">
                   <div className="flex-1">
                     <label className="block text-[10px] uppercase tracking-wider text-alt-color mb-1">Professor</label>
                     <input name="prof_name" type="text" defaultValue={course.prof_name || ""} className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                   </div>
                   <div className="flex-1">
                     <label className="block text-[10px] uppercase tracking-wider text-alt-color mb-1">Category</label>
                     <input name="category" type="text" defaultValue={course.category || ""} className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                   </div>
                 </div>
                 <div className="flex gap-4">
                   <div className="flex-1">
                     <label className="block text-[10px] uppercase tracking-wider text-alt-color mb-1">Year</label>
                     <input required name="year" type="number" defaultValue={course.year} className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                   </div>
                   <div className="flex-1">
                     <label className="block text-[10px] uppercase tracking-wider text-alt-color mb-1">Semester</label>
                     <select required name="semester" defaultValue={course.semester} className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary transition-all">
                       <option value="Fall" className="bg-primary">Fall</option>
                       <option value="Winter" className="bg-primary">Winter</option>
                       <option value="Full Summer" className="bg-primary">Full Summer</option>
                       <option value="Summer 1" className="bg-primary">Summer 1</option>
                       <option value="Summer 2" className="bg-primary">Summer 2</option>
                     </select>
                   </div>
                 </div>
                 <div>
                   <label className="block text-[10px] uppercase tracking-wider text-alt-color mb-1">Credits</label>
                   <input name="credits" type="number" step="0.5" defaultValue={course.credits || ""} className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                 </div>
                 <div className="flex flex-col">
                   <label className="block text-[10px] uppercase tracking-wider text-alt-color mb-1">Status</label>
                   <label className="flex items-center gap-2 group cursor-pointer">
                     <input name="in_progress" type="checkbox" defaultChecked={course.in_progress} className="w-4 h-4 accent-secondary rounded" />
                     <span className="text-xs uppercase tracking-wider text-secondary">In Progress</span>
                   </label>
                 </div>
                 <div className="flex gap-2 mt-2">
                   <NeonButton type="submit" className="flex-1 py-3 text-xs">Save</NeonButton>
                   <button type="button" onClick={handleDeleteCourse} className="px-3 border border-red-500/50 bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                   </button>
                 </div>
               </form>
             </GlassCard>
          ) : (
             <GlassCard className="flex flex-col gap-4 p-6 relative">
               <button onClick={() => setEditingCourse(true)} className="absolute top-4 right-4 text-alt-color hover:text-white transition-colors bg-prHighlight/20 p-2 rounded">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
               </button>
               <h3 className="text-xl font-orbitron text-secondary border-b border-prHighlight/50 pb-2 mb-2">Metrics Box</h3>
               <div className="flex justify-between items-center pb-2 border-b border-prHighlight/20">
                 <span className="text-xs uppercase tracking-widest text-alt-color/70">Instructor</span>
                 <span className="text-secondary text-sm">{course.prof_name || "Unassigned"}</span>
               </div>
               <div className="flex justify-between items-center pb-2 border-b border-prHighlight/20">
                 <span className="text-xs uppercase tracking-widest text-alt-color/70">Category</span>
                 <span className="text-secondary text-sm">{course.category || "Uncategorized"}</span>
               </div>
               <div className="flex justify-between items-center pb-2 border-b border-prHighlight/20">
                 <span className="text-xs uppercase tracking-widest text-alt-color/70">Credits</span>
                 <span className="text-secondary text-sm">{course.credits || "N/A"}</span>
               </div>
               <div className="flex justify-between items-center pb-2 border-b border-prHighlight/20">
                 <span className="text-xs uppercase tracking-widest text-alt-color/70">Status</span>
                 <span className={`text-sm ${course.in_progress ? "text-emerald-400" : "text-alt-color"}`}>
                   {course.in_progress ? "Active" : "Archived"}
                 </span>
               </div>
             </GlassCard>
          )}

          <div className="flex flex-col gap-4">
             <div className="flex justify-between items-end border-b border-prHighlight pb-2">
               <h3 className="text-lg font-orbitron text-secondary tracking-widest">Assignments</h3>
               <button 
                 onClick={() => { setAddingAssignment(!addingAssignment); setEditingAssignment(null); setSplitQuantity(1); }}
                 className={`text-xs uppercase tracking-wider transition-all flex items-center gap-1 ${addingAssignment ? 'text-secondary' : 'text-alt-color hover:text-white'}`}
               >
                 <span>{addingAssignment ? 'Cancel' : '+ Add'}</span>
               </button>
             </div>

             {(addingAssignment || editingAssignment) && (
               <GlassCard className="p-4 border-secondary/50 shadow-[0_0_15px_rgba(242,166,90,0.1)]">
                 <form onSubmit={(e) => editingAssignment ? handleUpdateAssignment(e) : handleSubmitAssignment(e)} className="flex flex-col gap-3">
                     <div className="flex justify-between items-center mb-2">
                       <h4 className="text-xs font-orbitron text-secondary uppercase tracking-wider">{editingAssignment ? 'Modify Params' : 'New Assignment'}</h4>
                     </div>
                     
                     <div className="flex gap-3">
                       <input required name="name" type="text" defaultValue={editingAssignment?.name || ""} placeholder="Designation" className="flex-1 bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary" />
                       
                       {/* Auto-split Quantity Input (Only show when adding new) */}
                       {!editingAssignment && (
                         <div className="w-16 relative group">
                           <input 
                             name="quantity" 
                             type="number" 
                             min="1" 
                             max="10" 
                             value={splitQuantity}
                             onChange={(e) => setSplitQuantity(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))} 
                             placeholder="Qty" 
                             className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary text-center" 
                           />
                           <div className="absolute -top-6 -left-1/2 transform -translate-x-1/2 bg-primary border text-nowrap border-prHighlight px-2 py-1 rounded text-[9px] text-alt-color opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                             Auto-Split Qty
                           </div>
                         </div>
                       )}
                     </div>

                     <div className="flex flex-col gap-2 mt-2">
                       {Array.from({ length: splitQuantity }).map((_, i) => (
                         <div key={i} className="flex p-3 bg-primary/30 rounded border border-prHighlight/30 relative">
                           {/* Individual Mode Toggle */}
                           <div className="flex gap-3 items-end w-full mt-4">
                             {splitQuantity > 1 && (
                               <span className="text-[18px] text-alt-color font-orbitron w-6 mt-6 shrink-0">#{i + 1}</span>
                             )}
                             
                             {/* Individual Mode Toggle beside inputs */}
                             <div className="flex flex-col gap-1 shrink-0 bg-primary/20 border border-prHighlight/50 rounded p-1 mb-[2px]">
                               <button 
                                 type="button"
                                 onClick={() => setInputModes(prev => { const n = [...prev]; n[i] = "percentage"; return n; })}
                                 className={`px-3 py-1.5 rounded text-[9px] uppercase tracking-widest transition-all ${(!inputModes[i] || inputModes[i] === "percentage") ? 'bg-secondary text-primary font-bold shadow-[0_0_10px_rgba(242,166,90,0.3)]' : 'text-alt-color hover:text-secondary'}`}
                               >
                                 % Match
                               </button>
                               <button 
                                 type="button"
                                 onClick={() => setInputModes(prev => { const n = [...prev]; n[i] = "points"; return n; })}
                                 className={`px-3 py-1.5 rounded text-[9px] uppercase tracking-widest transition-all ${inputModes[i] === "points" ? 'bg-secondary text-primary font-bold shadow-[0_0_10px_rgba(242,166,90,0.3)]' : 'text-alt-color hover:text-secondary'}`}
                               >
                                 Points
                               </button>
                             </div>

                             {(!inputModes[i] || inputModes[i] === "percentage") ? (
                               <div className="flex-1">
                                 <label className="text-[9px] text-alt-color uppercase tracking-wider mb-1 block">Mark %</label>
                                 <input name={splitQuantity > 1 ? `mark_${i}` : "mark"} type="number" step="0.01" defaultValue={editingAssignment?.mark ?? ""} placeholder="Grade" className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                               </div>
                             ) : (
                               <div className="flex-1 flex gap-2 items-center">
                                 <div className="flex-1">
                                   <label className="text-[9px] text-alt-color uppercase tracking-wider mb-1 block">Earned</label>
                                   <input name={splitQuantity > 1 ? `points_earned_${i}` : "points_earned"} type="number" step="0.01" placeholder="Pts" className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                                 </div>
                                 <span className="text-alt-color font-bold mt-4 shrink-0">/</span>
                                 <div className="flex-1">
                                   <label className="text-[9px] text-alt-color uppercase tracking-wider mb-1 block">Total</label>
                                   <input name={splitQuantity > 1 ? `points_total_${i}` : "points_total"} type="number" step="0.01" placeholder="Max" className="w-full bg-primary/50 border border-prHighlight rounded p-2 text-sm text-secondary focus:border-secondary transition-all" />
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       ))}
                       
                       <div className="w-full mt-1 border-t border-prHighlight/50 pt-1">
                         <label className="flex justify-between text-[9px] text-alt-color uppercase tracking-wider mb-1">
                           <span>{splitQuantity > 1 ? 'Total Group Weight %' : 'Weight %'}</span>
                           {splitQuantity > 1 && <span className="text-secondary/50 ml-1">(Averaging items over full weight)</span>}
                         </label>
                         <input required name="weight" type="number" step="0.01" defaultValue={editingAssignment?.weight ?? ""} placeholder="Total Wgt" className="w-full bg-primary/50 border border-prHighlight focus:border-secondary transition-colors rounded p-2 text-sm text-secondary" />
                       </div>
                     </div>
                     <div className="flex gap-2 mt-2">
                         <NeonButton type="submit" className="flex-1 py-2 text-xs">Execute {editingAssignment ? 'Update' : 'Add'}</NeonButton>
                         {editingAssignment && (
                             <button type="button" onClick={() => handleDeleteAssignment(editingAssignment)} className="px-3 bg-red-900/20 border border-red-500/50 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                             </button>
                         )}
                     </div>
                 </form>
               </GlassCard>
             )}

             {assignments.length > 0 ? (
               <div className="flex flex-col gap-2">
                 {assignments.map(a => (
                   <div key={a.id} className="flex justify-between items-center p-3 bg-primary/30 border border-prHighlight/50 rounded-lg hover:border-secondary transition-colors group/item relative">
                     <div className="flex flex-col">
                       <span className="text-secondary text-base font-bold">{a.name}</span>
                       <span className="text-[10px] text-alt-color uppercase tracking-wider">
                         M: {a.mark !== null && a.mark !== undefined ? <span className="text-secondary">{a.mark}%</span> : 'N/A'} • W: <span className="text-secondary">{a.weight}%</span>
                       </span>
                     </div>
                     <button 
                       onClick={() => { setEditingAssignment(a); setAddingAssignment(false); }}
                       className="p-2 text-alt-color hover:text-white bg-prHighlight/20 rounded transition-colors"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                     </button>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-8 text-alt-color bg-primary/20 rounded border border-prHighlight/30 outline-dashed outline-1 outline-prHighlight/50 outline-offset-[-5px]">
                 <span className="text-2xl mb-2 opacity-50 block">📂</span>
                 <p className="text-sm font-orbitron tracking-widest text-secondary opacity-70">Archive Empty</p>
               </div>
             )}
          </div>
        </div>

        {/* RIGHT COLUMN: Advanced Calculations & Graph */}
        <div className="lg:col-span-8 flex flex-col gap-8">
           
           <GlassCard className="p-8 pb-12 overflow-hidden relative border-secondary/40 shadow-[0_0_40px_rgba(242,166,90,0.1)]">
             <div className="flex justify-between items-start mb-6 border-b border-prHighlight/50 pb-4">
               <div>
                  <h2 className="text-2xl font-orbitron text-secondary">Diagnostic Matrix</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase tracking-widest text-alt-color">Calculating algorithms via python</span>
                  </div>
               </div>
               <button onClick={() => setForceGradeOpen(!forceGradeOpen)} className={`px-4 py-2 border transition-all rounded text-xs uppercase tracking-wider flex items-center gap-2 ${forceGradeOpen || (course.mark !== null && course.mark !== undefined) ? 'border-red-500 text-red-500 bg-red-900/20 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-prHighlight hover:border-red-500 text-alt-color hover:text-red-400 bg-primary/50'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>
                 {course.mark !== undefined && course.mark !== null ? 'Override Active' : 'Force Grade'}
               </button>
             </div>

             {forceGradeOpen && (
               <form onSubmit={handleForceGradeSubmit} className="mb-8 p-4 border border-red-500/50 bg-red-900/10 rounded-md animate-in fade-in slide-in-from-top-2 w-full flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs uppercase tracking-wider text-red-400 block mb-1">Manual Override Phase</label>
                    <input required name="force_mark" type="number" step="0.01" defaultValue={course.mark !== null ? course.mark : ""} placeholder="Forced Grade %" className="w-full bg-primary border border-red-500/50 rounded p-2 text-secondary focus:outline-none focus:border-red-400" />
                  </div>
                  <div className="flex flex-col gap-2 mt-4 ml-auto w-1/3">
                    <button type="submit" className="w-full bg-red-900/60 hover:bg-red-500 text-red-500 hover:text-white border border-red-500 rounded p-2 text-xs uppercase tracking-wider font-bold transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]">Execute</button>
                    {course.mark !== null && course.mark !== undefined && (
                      <button type="button" onClick={handleRemoveForceGrade} className="w-full bg-transparent border border-alt-color/30 hover:bg-alt-color/20 text-alt-color text-[10px] uppercase tracking-wider p-2 rounded transition-all">Remove</button>
                    )}
                  </div>
               </form>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                 
                 {/* Visual Graph Section */}
                 <div className="h-64 md:h-80 w-full relative drop-shadow-[0_0_15px_rgba(242,166,90,0.15)] flex justify-center items-center flex-col">
                   <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full">
                     {course.mark !== null && course.mark !== undefined ? (
                        <>
                           <div className="text-3xl font-orbitron font-bold text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]">{course.mark}%</div>
                           <div className="text-[10px] uppercase tracking-widest text-red-500/80 mt-1">Forced</div>
                        </>
                     ) : (
                        <>
                           <div className="text-4xl font-orbitron font-bold text-secondary drop-shadow-[0_0_10px_rgba(224,211,211,0.5)]">
                             {backendMetrics?.final_average ? `${backendMetrics.final_average}%` : 'N/A'}
                           </div>
                           <div className="text-[9px] uppercase tracking-widest text-alt-color mt-1">Average</div>
                        </>
                     )}
                   </div>
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={graphData}
                         innerRadius={90}
                         outerRadius={120}
                         paddingAngle={4}
                         dataKey="value"
                         stroke="none"
                         cornerRadius={5}
                       >
                         {graphData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                       <Tooltip 
                         formatter={(value: any, name: any) => [`${value}%`, name]}
                         contentStyle={{ backgroundColor: '#111827', borderColor: '#303642', borderRadius: '8px', padding: '10px' }}
                         itemStyle={{ color: '#F2A65A', fontFamily: 'Orbitron, sans-serif' }}
                       />
                       <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8a9ab3' }} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>

                 {/* Advanced Metrics Panel */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/40 border border-prHighlight/50 rounded-lg p-4 flex flex-col justify-between hover:border-secondary/50 transition-colors">
                      <span className="text-[10px] uppercase tracking-widest text-alt-color mb-2">Evaluated Weight</span>
                      <span className="text-2xl font-orbitron text-white">
                        {completedWeight}%
                      </span>
                    </div>
                    
                    <div className="bg-primary/40 border border-prHighlight/50 rounded-lg p-4 flex flex-col justify-between hover:border-secondary/50 transition-colors">
                      <span className="text-[10px] uppercase tracking-widest text-alt-color mb-2">Remaining Box</span>
                      <span className="text-2xl font-orbitron text-secondary drop-shadow-[0_0_8px_rgba(242,166,90,0.5)]">
                        {backendMetrics?.remaining_weight ? `${backendMetrics.remaining_weight}%` : '0%'}
                      </span>
                    </div>

                    <div className="col-span-2 bg-primary/40 border border-prHighlight/50 rounded-lg p-4 flex justify-between items-center hover:border-emerald-500/50 transition-colors group">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-alt-color">Est. YorkU GPA</span>
                        <div className="flex items-end gap-2 mt-1">
                          <span className="text-3xl font-orbitron text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                            {backendMetrics?.yorku_gpa ? backendMetrics.yorku_gpa : '0.0'}
                          </span>
                          <span className="text-lg font-bold text-emerald-400/50 mb-1">/ 9.0</span>
                        </div>
                      </div>
                      <div className="h-14 w-14 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-900/20 group-hover:bg-emerald-500/20 transition-colors">
                        <span className="text-2xl font-orbitron font-bold text-emerald-400">{backendMetrics?.yorku_letter || '-'}</span>
                      </div>
                    </div>

                    <div className="bg-primary/40 border border-prHighlight/50 rounded-lg p-4 flex flex-col justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-alt-color mb-2 wrap-break-words">Needed for 50%</span>
                      {backendMetrics?.get_fifty !== undefined && typeof backendMetrics.get_fifty === 'number' && backendMetrics.get_fifty <= 0 ? (
                        <span className="text-xl font-orbitron text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">Achieved</span>
                      ) : (
                        <span className={`text-xl font-orbitron ${backendMetrics?.get_fifty === 'N/A' || (typeof backendMetrics?.get_fifty === 'number' && backendMetrics.get_fifty > 100) ? 'text-red-400' : 'text-white'}`}>
                          {backendMetrics?.get_fifty || 'N/A'}{backendMetrics?.get_fifty !== 'N/A' && backendMetrics?.get_fifty ? '%' : ''}
                        </span>
                      )}
                    </div>

                    <div className="bg-primary/40 border border-prHighlight/50 rounded-lg p-3 flex flex-col justify-between hover:border-secondary/50 transition-colors">
                      <div className="flex justify-between items-center mb-2 gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-alt-color">Target %</span>
                        <input 
                          type="number" 
                          value={targetGrade || ""} 
                          onChange={handleTargetChange} 
                          placeholder="80"
                          className="w-15 bg-primary border border-prHighlight focus:border-secondary rounded px-1 py-1 text-sm text-secondary text-right outline-none font-orbitron" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-alt-color mb-1">Score Needed</span>
                        {backendMetrics?.target_required_score !== undefined && typeof backendMetrics.target_required_score === 'number' && backendMetrics.target_required_score <= 0 ? (
                          <span className="text-xl font-orbitron text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">Achieved</span>
                        ) : (
                          <span className={`text-xl font-orbitron ${backendMetrics?.target_required_score === 'N/A' || (typeof backendMetrics?.target_required_score === 'number' && backendMetrics.target_required_score > 100) ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`}>
                            {backendMetrics?.target_required_score || 'N/A'}{backendMetrics?.target_required_score !== 'N/A' && backendMetrics?.target_required_score ? '%' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 bg-primary/40 border border-prHighlight/50 rounded-lg p-4 flex justify-between items-center hover:border-blue-500/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-alt-color mb-1 block">Maximum Potential Mark</span>
                        <span className="text-[9px] text-alt-color/50 uppercase tracking-widest">+ 100% on remaining assignments</span>
                      </div>
                      <span className="text-3xl font-orbitron text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]">
                        {maxMark.toFixed(2)}%
                      </span>
                    </div>

                 </div>

             </div>
           </GlassCard>

        </div>

      </main>
    </div>
  );
}
