"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import GlassCard from "./GlassCard";
import { Course, BackendMetrics } from "../types";

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
  return (
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
             <input required name="force_mark" type="number" step="0.01" defaultValue={course.mark !== null && course.mark !== undefined ? course.mark : ""} placeholder="Forced Grade %" className="w-full bg-primary border border-red-500/50 rounded p-2 text-secondary focus:outline-none focus:border-red-400" />
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
  );
}
