"use client";

import GlassCard from "./GlassCard";
import { Course } from "../types";
import { User, Activity, CheckCircle2, Bookmark } from "lucide-react";

interface CourseCardProps {
  course: Course;
  finalPercentage: number | null;
  letterGrade: string;
  onClick: () => void;
}

export default function CourseCard({ course, finalPercentage, letterGrade, onClick }: CourseCardProps) {
  const getGradeColor = (percentage: number | null) => {
    if (percentage === null) return "bg-black/5 text-muted dark:bg-white/5 dark:text-muted border-black/10 dark:border-white/10";
    if (percentage >= 80) return "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    if (percentage >= 70) return "bg-blue-500/15 text-blue-700 border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
    if (percentage >= 60) return "bg-amber-500/15 text-amber-700 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
    if (percentage >= 50) return "bg-orange-500/15 text-orange-700 border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20";
    return "bg-red-500/15 text-red-700 border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
  };

  const getProgressColor = (percentage: number | null) => {
    if (percentage === null) return "bg-black/5 dark:bg-white/5";
    if (percentage >= 80) return "bg-emerald-500 dark:bg-emerald-500";
    if (percentage >= 70) return "bg-blue-500 dark:bg-blue-500";
    if (percentage >= 60) return "bg-amber-500 dark:bg-amber-500";
    if (percentage >= 50) return "bg-orange-500 dark:bg-orange-500";
    return "bg-red-500 dark:bg-red-500";
  };

  const gradeBadgeTheme = getGradeColor(finalPercentage);
  const progressBarTheme = getProgressColor(finalPercentage);

  return (
    <GlassCard 
      className="group flex flex-col h-full !p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer border border-transparent hover:border-black/5 dark:hover:border-white/5"
      onClick={onClick}
    >
      {/* Background Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="p-6 flex flex-col flex-grow relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-muted font-medium">
                {course.semester} {course.year}
              </span>
              {course.category && (
                <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                  {course.category}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-secondary group-hover:text-primary transition-colors leading-tight">
              {course.name}
            </h3>
          </div>
          
          {/* Prominent Grade Badge */}
          <div className={`flex flex-col items-center justify-center w-14 h-14 shrink-0 rounded-2xl border shadow-sm ${gradeBadgeTheme}`}>
            <span className="text-xl font-bold font-orbitron">{letterGrade}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 text-sm text-muted">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-secondary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest opacity-60">Instructor</span>
              <span className="text-secondary font-medium">{course.prof_name || "Unassigned"}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
              {course.in_progress ? <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <CheckCircle2 className="w-4 h-4 text-secondary" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest opacity-60">Status</span>
              <span className={course.in_progress ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-secondary font-medium"}>
                {course.in_progress ? "Active" : "Archived"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
             <Bookmark className="w-3.5 h-3.5 opacity-50" />
             <span className="text-[11px] font-medium text-muted">
               {course.credits || 3} Credits
             </span>
          </div>
          <div className="uppercase text-[10px] tracking-widest font-medium">
            {(course.mark !== undefined && course.mark !== null) ? (
              <span className="text-primary flex items-center gap-1 bg-primary/5 px-2 py-1 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                Forced
              </span>
            ) : (
              <span className="text-muted bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                Calculated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="h-1 w-full bg-black/5 dark:bg-white/5 absolute bottom-0 left-0">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${progressBarTheme}`} 
          style={{ width: `${finalPercentage !== null ? Math.min(100, Math.max(0, finalPercentage)) : 0}%` }}
        />
      </div>
    </GlassCard>
  );
}
