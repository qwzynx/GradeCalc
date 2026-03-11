"use client";

import { useState, useEffect } from "react";
import GlassCard from "./GlassCard";
import NeonButton from "./NeonButton";

interface AddCourseFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export default function AddCourseForm({ onSubmit, onCancel }: AddCourseFormProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Slight delay to ensure the mount transition triggers
    const timer = setTimeout(() => setIsMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setIsMounted(false);
    // Wait for animation duration (300ms) before unmounting
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-300 ease-in-out ${isMounted ? 'opacity-100' : 'opacity-0'}`} 
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <GlassCard className={`max-w-2xl w-full relative transition-all duration-300 ease-out transform ${isMounted ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-4'}`}>
        <button type="button" onClick={handleClose} className="absolute top-4 right-4 text-alt-color hover:text-white transition-colors bg-prHighlight/20 p-2 rounded z-20">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <h2 className="text-2xl mb-6 font-orbitron text-secondary border-b border-prHighlight pb-2 pr-12">Initialize New Course Parameters</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-wider text-alt-color mb-2">Course Designation *</label>
            <input required name="name" type="text" className="w-full bg-primary/50 border border-prHighlight rounded-md p-3 text-secondary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all" placeholder="e.g. CS 101" />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-wider text-alt-color mb-2">Professor</label>
            <input name="prof_name" type="text" className="w-full bg-primary/50 border border-prHighlight rounded-md p-3 text-secondary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all" placeholder="e.g. Dr. Smith" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-alt-color mb-2">Category *</label>
            <select required name="category" className="w-full bg-primary/50 border border-prHighlight rounded-md p-3 text-secondary focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer">
              <option value="" disabled className="bg-primary text-alt-color">Select Stream</option>
              <option value="LE/EECS" className="bg-primary text-secondary">LE/EECS</option>
              <option value="SC/MATH" className="bg-primary text-secondary">SC/MATH</option>
              <option value="SC/CHEM" className="bg-primary text-secondary">SC/CHEM</option>
              <option value="LE/ENG" className="bg-primary text-secondary">LE/ENG</option>
              <option value="SC/PHYS" className="bg-primary text-secondary">SC/PHYS</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-alt-color mb-2">Year *</label>
            <input required name="year" type="number" defaultValue={new Date().getFullYear()} className="w-full bg-primary/50 border border-prHighlight rounded-md p-3 text-secondary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all" />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-wider text-alt-color mb-2">Semester *</label>
            <select required name="semester" defaultValue="Fall" className="w-full bg-primary/50 border border-prHighlight rounded-md p-3 text-secondary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all appearance-none cursor-pointer">
              <option value="Fall" className="bg-primary text-secondary">Fall</option>
              <option value="Winter" className="bg-primary text-secondary">Winter</option>
              <option value="Full Summer" className="bg-primary text-secondary">Full Summer</option>
              <option value="Summer 1" className="bg-primary text-secondary">Summer 1</option>
              <option value="Summer 2" className="bg-primary text-secondary">Summer 2</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-alt-color mb-2">Credits</label>
            <input name="credits" type="number" step="0.5" className="w-full bg-primary/50 border border-prHighlight rounded-md p-3 text-secondary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all" placeholder="e.g. 3" />
          </div>

          <div className="flex flex-col">
            <label className="block text-xs uppercase tracking-wider text-alt-color mb-2">Status</label>
            <label htmlFor="in_progress" className="flex-1 flex items-center gap-3 bg-primary/50 border border-prHighlight rounded-md p-3 transition-all hover:border-secondary cursor-pointer group">
              <input name="in_progress" id="in_progress" type="checkbox" defaultChecked className="w-5 h-5 accent-secondary bg-primary border-prHighlight rounded focus:ring-secondary focus:ring-offset-primary cursor-pointer" />
              <span className="text-sm uppercase tracking-wider text-secondary group-hover:text-white transition-colors select-none">In Progress</span>
            </label>
          </div>
        </div>
        
        <NeonButton type="submit" className="mt-4 w-full py-4 text-lg">Execute Insertion</NeonButton>
      </form>
    </GlassCard>
    </div>
  );
}
