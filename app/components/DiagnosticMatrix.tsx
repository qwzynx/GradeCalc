"use client";

import { useRef, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import GlassCard from "./GlassCard";
import NumberInput from "./NumberInput";
import { Course, BackendMetrics } from "../types";
import { useTheme } from "@/components/ThemeProvider";

const LETTER_GRADES = [
  { letter: "A+", min: 90, max: 100 },
  { letter: "A",  min: 80, max: 89  },
  { letter: "B+", min: 75, max: 79  },
  { letter: "B",  min: 70, max: 74  },
  { letter: "C+", min: 65, max: 69  },
  { letter: "C",  min: 60, max: 64  },
  { letter: "D+", min: 55, max: 59  },
  { letter: "D",  min: 50, max: 54  },
  { letter: "F",  min: 0,  max: 49  },
] as const;

interface DiagnosticMatrixProps {
  course: Course;
  backendMetrics: BackendMetrics | null;
  targetGrade: number;
  handleTargetChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  forceGradeOpen: boolean;
  setForceGradeOpen: (open: boolean) => void;
  handleForceGradeSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleRemoveForceGrade: () => void;
  completedWeight: number;
  earnedWeight: number;
  lostWeight: number;
  remainingWeight: number;
  maxMark: number;
  graphData: { name: string, value: number, color: string }[];
}

export default function DiagnosticMatrix({
  course,
  backendMetrics,
  targetGrade,
  handleTargetChange,
  forceGradeOpen,
  setForceGradeOpen,
  handleForceGradeSubmit,
  handleRemoveForceGrade,
  completedWeight,
  earnedWeight,
  lostWeight,
  remainingWeight,
  maxMark,
  graphData
}: DiagnosticMatrixProps) {
  const { theme } = useTheme();
  const forceInputRef = useRef<HTMLInputElement>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const handleLetterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const letter = e.target.value;
    if (!letter) { setSelectedLetter(null); return; }
    const grade = LETTER_GRADES.find(g => g.letter === letter);
    if (grade && forceInputRef.current) {
      const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSet?.call(forceInputRef.current, String(grade.max));
      forceInputRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      setSelectedLetter(letter);
    }
  };

  return (
    <GlassCard className="p-8 pb-12 overflow-hidden relative border-black/10 shadow-lg bg-white">
      <div className="flex justify-between items-start mb-3 border-b border-black/10">
        <div>
           <h2 className="text-2xl font-orbitron font-bold text-primary">Diagnostic Matrix</h2>
        </div>
        <button onClick={() => { setForceGradeOpen(!forceGradeOpen); setSelectedLetter(null); }} className={`px-4 py-2 border transition-all rounded text-xs uppercase tracking-wider flex items-center gap-2 ${forceGradeOpen || (course.mark !== null && course.mark !== undefined) ? 'border-red-500 text-red-500 bg-red-50 shadow-sm' : 'border-black/20 hover:border-red-500 text-muted hover:text-red-600 bg-white'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>
          {course.mark !== undefined && course.mark !== null ? 'Override Active' : 'Force Grade'}
        </button>
      </div>

      {forceGradeOpen && (
        <form onSubmit={handleForceGradeSubmit} className="mb-4 p-2 border border-red-200 bg-red-50 rounded-md animate-in fade-in slide-in-from-top-2 w-full flex items-end gap-3">
           {/* Letter Grade Dropdown */}
           <div className="flex-1 min-w-0">
             <label className="text-[9px] uppercase tracking-widest text-red-700 block mb-1">Letter Grade</label>
             <select
               value={selectedLetter || ""}
               onChange={handleLetterSelect}
               className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-sm text-secondary font-montserrat focus:outline-none focus:border-red-500 cursor-pointer appearance-none"
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
             >
               <option value="" className="bg-white text-muted font-montserrat">— Letter —</option>
               {LETTER_GRADES.map((g) => (
                 <option key={g.letter} value={g.letter} className="bg-white text-secondary font-montserrat">
                   {g.letter}  ({g.min}% – {g.max}%)
                 </option>
               ))}
             </select>
           </div>

           {/* Manual % Input */}
           <div className="flex-1 min-w-0">
             <label className="text-[9px] uppercase tracking-widest text-red-700 block mb-1">Override %</label>
             <NumberInput
               ref={forceInputRef}
               required
               name="force_mark"
               step="0.01"
               defaultValue={course.mark !== null && course.mark !== undefined ? course.mark : ""}
               placeholder="Grade %"
               className="w-full bg-white border border-red-200 rounded px-2 py-1.5 text-sm text-secondary focus:outline-none focus:border-red-500"
               onChange={() => setSelectedLetter(null)}
             />
           </div>

           {/* Actions */}
           <div className="flex gap-2 shrink-0">
             <button type="submit" className="bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-500 rounded px-3 py-1.5 text-sm uppercase tracking-wider font-bold transition-all shadow-sm">Execute</button>
             {course.mark !== null && course.mark !== undefined && (
               <button type="button" onClick={handleRemoveForceGrade} className="bg-transparent border border-black/20 hover:bg-black/5 text-muted text-sm uppercase tracking-wider px-3 py-1.5 rounded transition-all">Remove</button>
             )}
           </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Visual Graph Section */}
          <div className="h-64 md:h-80 w-full relative drop-shadow-sm flex justify-center items-center flex-col">
            <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full">
              {course.mark !== null && course.mark !== undefined ? (
                 <>
                    <div className="text-3xl font-orbitron font-bold text-red-600">{course.mark.toFixed(2)}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-red-600 mt-1">Forced</div>
                 </>
              ) : (
                 <>
                    <div className="text-4xl font-orbitron font-bold text-secondary">
                      {backendMetrics?.final_average ? `${backendMetrics.final_average.toFixed(2)}%` : 'N/A'}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-muted mt-1">Average</div>
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
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#1E1E1E' : '#ffffff', borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb', borderRadius: '8px', padding: '10px' }}
                  itemStyle={{ color: '#E31D2B', fontFamily: 'Orbitron, sans-serif' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: theme === 'dark' ? '#A0A0A0' : '#333333' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Advanced Metrics Panel */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-black/5 border border-black/10 rounded-lg p-4 flex flex-col justify-between hover:border-primary/50 transition-colors">
               <span className="text-[10px] uppercase tracking-widest text-muted mb-2">Evaluated Weight</span>
               <span className="text-2xl font-orbitron text-secondary font-bold">
                 {completedWeight}%
               </span>
             </div>
             
             <div className="bg-black/5 border border-black/10 rounded-lg p-4 flex flex-col justify-between hover:border-primary/50 transition-colors">
               <span className="text-[10px] uppercase tracking-widest text-muted mb-2">Remaining Box</span>
               <span className="text-2xl font-orbitron text-primary font-bold">
                 {backendMetrics?.remaining_weight ? `${backendMetrics.remaining_weight}%` : '0%'}
               </span>
             </div>

             <div className="col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex justify-between items-center hover:border-emerald-500 transition-colors group">
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase tracking-widest text-emerald-800">Est. YorkU GPA</span>
                 <div className="flex items-end gap-2 mt-1">
                   <span className="text-3xl font-orbitron text-emerald-600 font-bold">
                     {backendMetrics?.yorku_gpa ? backendMetrics.yorku_gpa : '0.0'}
                   </span>
                   <span className="text-lg font-bold text-emerald-600 mb-1">/ 9.0</span>
                 </div>
               </div>
               <div className="h-14 w-14 rounded-full border-2 border-emerald-200 flex items-center justify-center bg-white group-hover:bg-emerald-100 transition-colors">
                 <span className="text-2xl font-orbitron font-bold text-emerald-600">{backendMetrics?.yorku_letter || '-'}</span>
               </div>
             </div>

             <div className="bg-black/5 border border-black/10 rounded-lg p-4 flex flex-col justify-between">
               <span className="text-[10px] uppercase tracking-widest text-muted mb-2 wrap-break-words">Needed for 50%</span>
               {backendMetrics?.get_fifty !== undefined && typeof backendMetrics.get_fifty === 'number' && backendMetrics.get_fifty <= 0 ? (
                 <span className="text-xl font-orbitron text-emerald-600 font-bold">Achieved</span>
               ) : (
                 <span className={`text-xl font-orbitron font-bold ${backendMetrics?.get_fifty === 'N/A' || (typeof backendMetrics?.get_fifty === 'number' && backendMetrics.get_fifty > 100) ? 'text-red-600' : 'text-secondary'}`}>
                   {backendMetrics?.get_fifty || 'N/A'}{backendMetrics?.get_fifty !== 'N/A' && backendMetrics?.get_fifty ? '%' : ''}
                 </span>
               )}
             </div>

             <div className="bg-black/5 border border-black/10 rounded-lg p-3 flex flex-col justify-between hover:border-primary/50 transition-colors">
               <div className="flex justify-between items-center mb-2 gap-2">
                 <span className="text-[10px] uppercase tracking-widest text-muted">Target %</span>
                  <NumberInput 
                    value={targetGrade || ""} 
                    onChange={handleTargetChange} 
                    placeholder="80"
                    className="w-15 bg-white border border-black/20 focus:border-primary rounded px-1 py-1 text-sm text-secondary text-right outline-none font-orbitron" 
                  />
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] uppercase tracking-widest text-muted mb-1">Score Needed</span>
                 {backendMetrics?.target_required_score !== undefined && typeof backendMetrics.target_required_score === 'number' && backendMetrics.target_required_score <= 0 ? (
                   <span className="text-xl font-orbitron text-emerald-600 font-bold">Achieved</span>
                 ) : (
                   <span className={`text-xl font-orbitron ${backendMetrics?.target_required_score === 'N/A' || (typeof backendMetrics?.target_required_score === 'number' && backendMetrics.target_required_score > 100) ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}`}>
                     {backendMetrics?.target_required_score || 'N/A'}{backendMetrics?.target_required_score !== 'N/A' && backendMetrics?.target_required_score ? '%' : ''}
                   </span>
                 )}
               </div>
             </div>

             <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center hover:border-blue-500 transition-colors">
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase tracking-widest text-blue-800 mb-1 block">Maximum Potential Mark</span>
                 <span className="text-[9px] text-blue-800/70 uppercase tracking-widest">+ 100% on remaining assignments</span>
               </div>
               <span className="text-3xl font-orbitron text-blue-600 font-bold">
                 {maxMark.toFixed(2)}%
               </span>
             </div>

          </div>

      </div>
    </GlassCard>
  );
}
