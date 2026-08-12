"use client";

import GlassCard from "./GlassCard";
import NeonButton from "./NeonButton";
import NumberInput from "./NumberInput";

interface AddCourseFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

// Rendered inside <AnimatedOverlay>, which owns the backdrop, the enter/exit
// animation, scroll locking and Escape-to-close.
export default function AddCourseForm({ onSubmit, onCancel }: AddCourseFormProps) {
  return (
    <GlassCard className="w-full relative p-5 sm:p-6">
      <button type="button" onClick={onCancel} aria-label="Close" className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center justify-center w-10 h-10 text-muted hover:text-secondary transition-colors bg-black/5 rounded-lg z-20">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
      <h2 className="text-lg sm:text-2xl mb-5 sm:mb-6 font-orbitron font-bold text-secondary border-b border-black/10 pb-2 pr-12 leading-tight">Initialize New Course Parameters</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-5 sm:gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-wider text-muted mb-2">Course Designation *</label>
            <input required name="name" type="text" className="w-full bg-white border border-black/20 shadow-sm rounded-md p-3 min-h-[44px] text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="e.g. CS 101" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted mb-2">Professor</label>
            <input name="prof_name" type="text" className="w-full bg-white border border-black/20 shadow-sm rounded-md p-3 min-h-[44px] text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="e.g. Dr. Smith" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted mb-2">Category *</label>
            <select required name="category" className="w-full bg-white border border-black/20 shadow-sm rounded-md p-3 min-h-[44px] text-secondary focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer">
              <option value="" disabled className="bg-white text-muted">Select Stream</option>
              <option value="LE/EECS" className="bg-white text-secondary">LE/EECS</option>
              <option value="SC/MATH" className="bg-white text-secondary">SC/MATH</option>
              <option value="SC/CHEM" className="bg-white text-secondary">SC/CHEM</option>
              <option value="LE/ENG" className="bg-white text-secondary">LE/ENG</option>
              <option value="SC/PHYS" className="bg-white text-secondary">SC/PHYS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted mb-2">Year *</label>
            <NumberInput required name="year" inputMode="numeric" defaultValue={new Date().getFullYear()} className="w-full bg-white border border-black/20 shadow-sm rounded-md p-3 min-h-[44px] text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted mb-2">Semester *</label>
            <select required name="semester" defaultValue="Fall" className="w-full bg-white border border-black/20 shadow-sm rounded-md p-3 min-h-[44px] text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer">
              <option value="Fall" className="bg-white text-secondary">Fall</option>
              <option value="Winter" className="bg-white text-secondary">Winter</option>
              <option value="Full Summer" className="bg-white text-secondary">Full Summer</option>
              <option value="Summer 1" className="bg-white text-secondary">Summer 1</option>
              <option value="Summer 2" className="bg-white text-secondary">Summer 2</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted mb-2">Credits</label>
            <NumberInput name="credits" step="0.5" inputMode="decimal" className="w-full bg-white border border-black/20 shadow-sm rounded-md p-3 min-h-[44px] text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="e.g. 3" />
          </div>

          <div className="flex flex-col">
            <label className="block text-xs uppercase tracking-wider text-muted mb-2">Status</label>
            <label htmlFor="in_progress" className="flex-1 flex items-center gap-3 bg-white border border-black/20 shadow-sm rounded-md p-3 min-h-[44px] transition-all hover:border-primary cursor-pointer group">
              <input name="in_progress" id="in_progress" type="checkbox" defaultChecked className="w-5 h-5 accent-primary bg-white border-black/20 rounded focus:ring-primary focus:ring-offset-background cursor-pointer" />
              <span className="text-sm uppercase tracking-wider text-secondary group-hover:text-primary transition-colors select-none font-semibold">In Progress</span>
            </label>
          </div>
        </div>

        <NeonButton type="submit" className="mt-2 sm:mt-4 w-full py-3.5 sm:py-4 text-base sm:text-lg">Execute Insertion</NeonButton>
      </form>
    </GlassCard>
  );
}
