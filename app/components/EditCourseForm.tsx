"use client";

import GlassCard from "./GlassCard";
import NeonButton from "./NeonButton";
import NumberInput from "./NumberInput";
import { Course } from "../types";

interface EditCourseFormProps {
  course: Course;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export default function EditCourseForm({ course, onSubmit, onCancel, onDelete }: EditCourseFormProps) {
  return (
     <GlassCard className="form-card relative z-10 w-full bg-white shadow-xl border-black/10">
       <div className="flex justify-between items-center border-b border-black/10 pb-2 mb-4">
         <h2 className="text-xl font-orbitron font-bold text-secondary">Modify Parameters</h2>
         <button onClick={onCancel} className="text-muted hover:text-secondary transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
         </button>
       </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
         <div>
           <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Designation</label>
           <input required name="name" type="text" defaultValue={course.name} className="w-full bg-white border border-black/20 rounded p-2 text-sm text-secondary focus:border-primary transition-all shadow-sm" />
         </div>
         <div className="flex gap-4">
           <div className="flex-1">
             <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Professor</label>
             <input name="prof_name" type="text" defaultValue={course.prof_name || ""} className="w-full bg-white border border-black/20 rounded p-2 text-sm text-secondary focus:border-primary transition-all shadow-sm" />
           </div>
           <div className="flex-1">
             <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Category *</label>
             <select required name="category" defaultValue={course.category || ""} className="w-full bg-white border border-black/20 rounded p-2 text-sm text-secondary focus:border-primary transition-all appearance-none cursor-pointer shadow-sm">
               <option value="" disabled className="bg-white text-muted">Select Stream</option>
               <option value="LE/EECS" className="bg-white text-secondary">LE/EECS</option>
               <option value="SC/MATH" className="bg-white text-secondary">SC/MATH</option>
               <option value="SC/CHEM" className="bg-white text-secondary">SC/CHEM</option>
               <option value="LE/ENG" className="bg-white text-secondary">LE/ENG</option>
               <option value="SC/PHYS" className="bg-white text-secondary">SC/PHYS</option>
             </select>
           </div>
         </div>
         <div className="flex gap-4">
           <div className="flex-1">
             <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Year</label>
              <NumberInput required name="year" defaultValue={course.year} className="w-full bg-white border border-black/20 rounded p-2 text-sm text-secondary focus:border-primary transition-all shadow-sm" />
           </div>
           <div className="flex-1">
             <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Semester</label>
             <select required name="semester" defaultValue={course.semester} className="w-full bg-white border border-black/20 rounded p-2 text-sm text-secondary transition-all shadow-sm">
               <option value="Fall" className="bg-white">Fall</option>
               <option value="Winter" className="bg-white">Winter</option>
               <option value="Full Summer" className="bg-white">Full Summer</option>
               <option value="Summer 1" className="bg-white">Summer 1</option>
               <option value="Summer 2" className="bg-white">Summer 2</option>
             </select>
           </div>
         </div>
         <div>
           <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Credits</label>
            <NumberInput name="credits" step="0.5" defaultValue={course.credits || ""} className="w-full bg-white border border-black/20 rounded p-2 text-sm text-secondary focus:border-primary transition-all shadow-sm" />
         </div>
         <div className="flex flex-col">
           <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">Status</label>
           <label className="flex items-center gap-2 group cursor-pointer">
             <input name="in_progress" type="checkbox" defaultChecked={course.in_progress} className="w-4 h-4 accent-primary rounded cursor-pointer" />
             <span className="text-xs uppercase tracking-wider text-secondary font-semibold">In Progress</span>
           </label>
         </div>
         <div className="flex gap-2 mt-2">
           <NeonButton type="submit" className="flex-1 py-3 text-xs">Save</NeonButton>
           <button type="button" onClick={onDelete} className="px-3 border border-red-500 bg-white text-red-500 hover:bg-red-50 hover:text-red-600 transition-all rounded shadow-sm">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
           </button>
         </div>
       </form>
     </GlassCard>
  );
}
