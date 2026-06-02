"use client";

import { useRef, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, TooltipProps } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "./GlassCard";
import NumberInput from "./NumberInput";
import { Course, BackendMetrics } from "../types";
import { useTheme } from "@/components/ThemeProvider";
import { GRADE_MAPPING_4_0 } from "@/lib/calculations";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  return (
    <AnimatePresence mode="wait">
      {active && payload && payload.length ? (
        <motion.div 
          key="tooltip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-surface border border-black/10 dark:border-white/10 p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] pointer-events-none min-w-[120px]"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm uppercase tracking-wider text-muted font-orbitron font-bold">
              {payload[0].name}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-primary font-orbitron tabular-nums">
                {payload[0].value.toFixed(2)}%
              </span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

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
  const [is4Scale, setIs4Scale] = useState(false);
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

  // Determine which letter to use for 4.0 scale mapping
  const getActiveLetter = () => {
    // If there's a forced mark, find its letter
    if (course.mark !== null && course.mark !== undefined) {
      const mark = course.mark;
      const grade = LETTER_GRADES.find(g => mark >= g.min && mark <= g.max);
      return grade ? grade.letter : (backendMetrics?.yorku_letter || '-');
    }
    // Fallback to backend calculated letter
    return backendMetrics?.yorku_letter || '-';
  };

  const activeLetter = getActiveLetter();

  return (
    <GlassCard className="p-4 sm:p-8 pb-10 sm:pb-12 overflow-hidden relative border-black/10 shadow-lg bg-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-3 border-b border-black/10 pb-2 sm:pb-0 gap-3">
        <div>
           <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-primary">Diagnostic Matrix</h2>
        </div>
        <button 
          onClick={() => { setForceGradeOpen(!forceGradeOpen); setSelectedLetter(null); }} 
          className={`w-full sm:w-auto px-4 py-2 border transition-all rounded-lg text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-2 font-bold font-orbitron shadow-sm relative -top-1 sm:-top-2 ${
            course.mark !== undefined && course.mark !== null 
              ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30' 
              : forceGradeOpen
                ? 'border-primary bg-primary text-white shadow-md'
                : 'border-black/10 dark:border-white/10 bg-surface text-muted hover:text-primary hover:border-primary/50 hover:shadow-md'
          }`}
        >
          {course.mark !== undefined && course.mark !== null ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="22" x2="18" y1="12" y2="12" /><line x1="6" x2="2" y1="12" y2="12" /><line x1="12" x2="12" y1="6" y2="2" /><line x1="12" x2="12" y1="22" y2="18" /></svg>
          )}
          {course.mark !== undefined && course.mark !== null ? 'Override Active' : forceGradeOpen ? 'Close Editor' : 'Force Grade'}
        </button>
      </div>

      {forceGradeOpen && (
        <form onSubmit={handleForceGradeSubmit} className="mb-6 p-4 border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 rounded-xl animate-in fade-in slide-in-from-top-2 w-full flex flex-col sm:flex-row items-stretch sm:items-end gap-4 shadow-inner">
          {/* Letter Grade Dropdown */}
          <div className="flex-1 min-w-0">
            <label className="text-[10px] uppercase tracking-[0.2em] text-primary/80 dark:text-primary/70 block mb-1.5 font-bold font-orbitron">Letter Grade</label>
            <div className="relative group">
              <select
                value={selectedLetter || ""}
                onChange={handleLetterSelect}
                className="w-full bg-surface border border-black/10 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-secondary font-montserrat focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 cursor-pointer appearance-none min-h-[44px] transition-all group-hover:border-primary/50"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23E31D2B' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '12px' }}
              >
                <option value="" className="bg-surface text-muted font-montserrat">— Select Letter —</option>
                {LETTER_GRADES.map((g) => (
                  <option key={g.letter} value={g.letter} className="bg-surface text-secondary font-montserrat font-semibold">
                    {g.letter} ({g.min}% – {g.max}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Manual % Input */}
          <div className="flex-1 min-w-0">
            <label className="text-[10px] uppercase tracking-[0.2em] text-primary/80 dark:text-primary/70 block mb-1.5 font-bold font-orbitron">Override %</label>
            <NumberInput
              ref={forceInputRef}
              required
              name="force_mark"
              step="0.01"
              defaultValue={course.mark !== null && course.mark !== undefined ? course.mark : ""}
              placeholder="Grade %"
              className="w-full bg-surface border border-black/10 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 min-h-[44px] placeholder:text-muted/50 transition-all hover:border-primary/50 font-montserrat font-semibold"
              onChange={() => setSelectedLetter(null)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button type="submit" className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white border border-primary rounded-lg px-6 py-2.5 text-xs sm:text-sm uppercase tracking-widest font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 min-h-[44px] font-orbitron">
              Execute
            </button>
            {course.mark !== null && course.mark !== undefined && (
              <button type="button" onClick={handleRemoveForceGrade} className="flex-1 sm:flex-none bg-surface border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-muted hover:text-secondary px-4 py-2.5 rounded-lg text-xs sm:text-sm uppercase tracking-widest transition-all min-h-[44px] font-orbitron">
                Reset
              </button>
            )}
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Visual Graph Section */}
          <div className="h-72 sm:h-80 w-full relative drop-shadow-sm flex justify-center items-center flex-col">
            <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full">
              {course.mark !== null && course.mark !== undefined ? (
                 <>
                    <div className="text-2xl sm:text-3xl font-orbitron font-bold text-red-600">{course.mark.toFixed(2)}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-red-600 mt-1">Forced</div>
                 </>
              ) : (
                 <>
                    <div className="text-3xl sm:text-4xl font-orbitron font-bold text-secondary">
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
                  innerRadius="65%"
                  outerRadius="90%"
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {graphData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />}
                  animationDuration={300}
                  animationEasing="ease-out"
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: theme === 'dark' ? '#A0A0A0' : '#333333' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Advanced Metrics Panel */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
             <div className="bg-black/5 border border-black/10 rounded-lg p-3 sm:p-4 flex flex-col justify-between hover:border-primary/50 transition-colors">
               <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted mb-2">Evaluated Weight</span>
               <span className="text-xl sm:text-2xl font-orbitron text-secondary font-bold">
                 {completedWeight}%
               </span>
             </div>
             
             <div className="bg-black/5 border border-black/10 rounded-lg p-3 sm:p-4 flex flex-col justify-between hover:border-primary/50 transition-colors">
               <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted mb-2">Remaining Box</span>
               <span className="text-xl sm:text-2xl font-orbitron text-primary font-bold">
                 {backendMetrics?.remaining_weight ? `${backendMetrics.remaining_weight}%` : '0%'}
               </span>
             </div>

             <div 
               className="col-span-2 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border border-emerald-500/10 dark:border-emerald-500/20 rounded-xl p-4 sm:p-5 flex justify-between items-center hover:border-emerald-500/40 transition-all duration-300 group shadow-xs cursor-pointer"
               onClick={() => setIs4Scale(!is4Scale)}
             >
               <div className="flex flex-col">
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-800/70 dark:text-emerald-400/70 font-orbitron font-bold">
                     {is4Scale ? "Est. 4.0 Scale GPA" : "Est. YorkU GPA"}
                   </span>
                   <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 text-emerald-600 dark:text-emerald-400"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                 </div>
                 <div className="flex items-end gap-2 mt-1.5">
                   <span className="text-3xl sm:text-4xl font-orbitron text-emerald-600 dark:text-emerald-400 font-bold leading-none animate-in fade-in zoom-in-95 duration-200" key={is4Scale ? '4.0' : '9.0'}>
                     {is4Scale
                       ? (GRADE_MAPPING_4_0[activeLetter]?.value?.toFixed(2) || '0.00')
                       : (course.mark !== null && course.mark !== undefined
                           ? ((LETTER_GRADES.find(g => course.mark! >= g.min && course.mark! <= g.max)?.min ?? 0) / 10).toFixed(2) // Approximation for forced GPA display if needed, but let's stick to calculated
                           : (backendMetrics?.yorku_gpa ? backendMetrics.yorku_gpa.toFixed(2) : '0.00'))}
                   </span>
                   <span className="text-sm sm:text-base font-bold text-emerald-600/50 dark:text-emerald-400/40 mb-0.5">/ {is4Scale ? "4.0" : "9.0"}</span>
                 </div>
               </div>
               <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center bg-emerald-50/50 dark:bg-emerald-500/10 shadow-xs group-hover:border-emerald-500/40 group-hover:shadow-md transition-all duration-300">
                 <span className="text-2xl sm:text-3xl font-orbitron font-bold text-emerald-600 dark:text-emerald-400">{activeLetter}</span>
               </div>
             </div>

             <div className="bg-black/5 border border-black/10 rounded-lg p-3 sm:p-4 flex flex-col justify-between">
               <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted mb-2 wrap-break-words">Needed for 50%</span>
               {backendMetrics?.get_fifty !== undefined && typeof backendMetrics.get_fifty === 'number' && backendMetrics.get_fifty <= 0 ? (
                 <span className="text-lg sm:text-xl font-orbitron text-emerald-600 font-bold">Achieved</span>
               ) : (
                 <span className={`text-lg sm:text-xl font-orbitron font-bold ${backendMetrics?.get_fifty === 'N/A' || (typeof backendMetrics?.get_fifty === 'number' && backendMetrics.get_fifty > 100) ? 'text-red-600' : 'text-secondary'}`}>
                   {backendMetrics?.get_fifty || 'N/A'}{backendMetrics?.get_fifty !== 'N/A' && backendMetrics?.get_fifty ? '%' : ''}
                 </span>
               )}
             </div>

             <div className="bg-black/5 border border-black/10 rounded-lg p-3 sm:p-4 flex flex-col justify-between hover:border-primary/50 transition-colors">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                 <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted">Target %</span>
                  <NumberInput 
                    value={targetGrade || ""} 
                    onChange={handleTargetChange} 
                    placeholder="80"
                    className="w-full sm:w-15 bg-white border border-black/20 focus:border-primary rounded px-1 py-1 text-sm text-secondary text-right outline-none font-orbitron" 
                  />
               </div>
               <div className="flex flex-col">
                 <span className="text-[9px] uppercase tracking-widest text-muted mb-1">Score Needed</span>
                 {backendMetrics?.target_required_score !== undefined && typeof backendMetrics.target_required_score === 'number' && backendMetrics.target_required_score <= 0 ? (
                   <span className="text-lg sm:text-xl font-orbitron text-emerald-600 font-bold">Achieved</span>
                 ) : (
                   <span className={`text-lg sm:text-xl font-orbitron ${backendMetrics?.target_required_score === 'N/A' || (typeof backendMetrics?.target_required_score === 'number' && backendMetrics.target_required_score > 100) ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}`}>
                     {backendMetrics?.target_required_score || 'N/A'}{backendMetrics?.target_required_score !== 'N/A' && backendMetrics?.target_required_score ? '%' : ''}
                   </span>
                 )}
               </div>
             </div>

             <div className="col-span-2 bg-blue-500/[0.04] dark:bg-blue-500/[0.08] border border-blue-500/10 dark:border-blue-500/20 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-blue-500/40 transition-all duration-300 group shadow-xs">
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase tracking-[0.15em] text-blue-800/70 dark:text-blue-400/70 font-orbitron font-bold">Maximum Potential Mark</span>
                 <span className="text-[9px] text-blue-800/50 dark:text-blue-400/50 uppercase tracking-wider mt-0.5">+ 100% on remaining assignments</span>
               </div>
               <span className="text-3xl sm:text-4xl font-orbitron text-blue-600 dark:text-blue-400 font-bold leading-none">
                 {maxMark.toFixed(2)}%
               </span>
             </div>

          </div>

      </div>
    </GlassCard>
  );
}
