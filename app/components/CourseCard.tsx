"use client";

import GlassCard from "./GlassCard";
import { Course } from "../types";

interface CourseCardProps {
  course: Course;
  finalPercentage: number | null;
  letterGrade: string;
  onClick: () => void;
}

export default function CourseCard({ course, finalPercentage, letterGrade, onClick }: CourseCardProps) {
  return (
    <GlassCard 
      className="group flex flex-col h-full hover:ring-2 hover:ring-secondary hover:scale-[1.02] cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-orbitron font-bold text-secondary group-hover:text-primary transition-colors">{course.name}</h3>
        <span className="text-xs uppercase tracking-wider bg-background border border-black/10 px-4 py-1 rounded text-secondary whitespace-nowrap shrink-0">{course.semester} {course.year}</span>
      </div>
      <div className="flex-1 space-y-3 text-sm text-muted mt-2">
        <div className="flex justify-between items-center border-b border-black/10 pb-2">
          <span className="uppercase text-[10px] tracking-widest">Instructor</span>
          <span className="text-secondary">{course.prof_name || "Unassigned"}</span>
        </div>
        <div className="flex justify-between items-center border-b border-black/10 pb-2">
          <span className="uppercase text-[10px] tracking-widest">Status</span>
          <span className={course.in_progress ? "text-emerald-600 font-medium" : "text-muted"}>
            {course.in_progress ? "Active" : "Archived"}
          </span>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-black/10 flex justify-between items-end">
        <div className="uppercase text-[10px] tracking-widest text-muted">
          {(course.mark !== undefined && course.mark !== null) ? (
            <span className="text-primary font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              Forced Grade Active
            </span>
          ) : "Calculated Grade"}
        </div>
        <div className="text-2xl font-orbitron">
          {finalPercentage !== null ? (
            <span className={`${
                finalPercentage >= 80 ? "text-emerald-600" 
              : finalPercentage >= 70 ? "text-blue-600"
              : finalPercentage >= 60 ? "text-amber-600"
              : finalPercentage >= 50 ? "text-orange-600"
              : "text-red-600"
            } font-bold`}>{letterGrade}</span>
          ) : (
            <span className="text-muted italic text-lg">{letterGrade}</span>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
