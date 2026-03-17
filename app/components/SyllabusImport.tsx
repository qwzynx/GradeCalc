"use client";

import { useState, useRef } from "react";
import GlassCard from "./GlassCard";
import NeonButton from "./NeonButton";
import NumberInput from "./NumberInput";

interface ParsedAssignment {
  name: string;
  weight: number;
}

interface ParsedCourse {
  name: string;
  prof_name?: string;
  semester?: string;
  year?: number;
  credits?: number;
  category?: string | null;
}

interface SyllabusImportProps {
  onImport: (course: ParsedCourse, assignments: ParsedAssignment[]) => void;
  onCancel: () => void;
}

export default function SyllabusImport({ onImport, onCancel }: SyllabusImportProps) {
  const [phase, setPhase] = useState<"upload" | "loading" | "preview" | "error">("upload");
  const [parsedCourse, setParsedCourse] = useState<ParsedCourse | null>(null);
  const [parsedAssignments, setParsedAssignments] = useState<ParsedAssignment[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setErrorMessage("Please upload a PDF file.");
      setPhase("error");
      return;
    }

    setFileName(file.name);
    setPhase("loading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-syllabus", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse syllabus");
      }

      const data = await res.json();

      if (!data.course || !data.assignments) {
        throw new Error("AI could not extract course data from this file.");
      }

      setParsedCourse(data.course);
      setParsedAssignments(data.assignments);
      setPhase("preview");
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong");
      setPhase("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveAssignment = (index: number) => {
    setParsedAssignments(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAssignment = (index: number, field: "name" | "weight", value: string) => {
    setParsedAssignments(prev =>
      prev.map((a, i) =>
        i === index
          ? { ...a, [field]: field === "weight" ? parseFloat(value) || 0 : value }
          : a
      )
    );
  };

  const handleConfirm = () => {
    if (parsedCourse) {
      onImport(parsedCourse, parsedAssignments);
    }
  };

  const totalWeight = parsedAssignments.reduce((sum, a) => sum + a.weight, 0);

  // --- Upload Phase ---
  if (phase === "upload") {
    return (
      <GlassCard className="max-w-lg w-full relative">
        <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-alt-color hover:text-white transition-colors bg-prHighlight/20 p-2 rounded z-20">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <h2 className="text-xl mb-4 font-orbitron text-secondary border-b border-prHighlight pb-2 pr-12">Import Syllabus</h2>
        <p className="text-sm text-alt-color mb-4">Upload your course syllabus (PDF) and AI will automatically extract the course info and graded components.</p>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-secondary bg-secondary/10 scale-[1.02]"
              : "border-prHighlight hover:border-secondary/50 hover:bg-primary/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileInput} className="hidden" />
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full border border-prHighlight flex items-center justify-center bg-primary/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
              </svg>
            </div>
            <div>
              <p className="text-secondary font-orbitron text-sm tracking-wider">Drop PDF here or click to browse</p>
              <p className="text-alt-color/50 text-xs mt-1">Supports .pdf files</p>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // --- Loading Phase ---
  if (phase === "loading") {
    return (
      <GlassCard className="max-w-lg w-full text-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-prHighlight border-t-secondary animate-spin"></div>
            <div className="absolute inset-0 h-14 w-14 rounded-full border-4 border-transparent border-b-secondary animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div>
            <p className="text-secondary font-orbitron tracking-wider text-sm">Analyzing Syllabus</p>
            <p className="text-alt-color/60 text-xs mt-1 font-montserrat">Processing <span className="text-secondary/80">{fileName}</span></p>
          </div>
          <div className="flex gap-1 mt-2">
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </GlassCard>
    );
  }

  // --- Error Phase ---
  if (phase === "error") {
    return (
      <GlassCard className="max-w-lg w-full">
        <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-alt-color hover:text-white transition-colors bg-prHighlight/20 p-2 rounded z-20">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <div className="text-center py-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-2 border-red-500/50 flex items-center justify-center bg-red-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/>
            </svg>
          </div>
          <div>
            <p className="text-red-400 font-orbitron tracking-wider text-sm">Parse Failed</p>
            <p className="text-alt-color/70 text-xs mt-2 max-w-sm">{errorMessage}</p>
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={() => { setPhase("upload"); setErrorMessage(""); }} className="px-4 py-2 border border-prHighlight hover:border-secondary text-alt-color hover:text-secondary rounded text-xs uppercase tracking-wider transition-all">
              Try Again
            </button>
            <button onClick={onCancel} className="px-4 py-2 border border-prHighlight text-alt-color hover:text-white rounded text-xs uppercase tracking-wider transition-all">
              Cancel
            </button>
          </div>
        </div>
      </GlassCard>
    );
  }

  // --- Preview Phase ---
  return (
    <GlassCard className="max-w-2xl w-full relative">
      <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-alt-color hover:text-white transition-colors bg-prHighlight/20 p-2 rounded z-20">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <h2 className="text-xl mb-1 font-orbitron text-secondary border-b border-prHighlight pb-2 pr-12">Review Extracted Data</h2>
      <p className="text-[10px] text-alt-color/60 uppercase tracking-widest mb-4">Verify and edit before importing — parsed from <span className="text-secondary/70">{fileName}</span></p>

      {/* Course Info */}
      <div className="mb-5">
        <h3 className="text-[10px] uppercase tracking-widest text-emerald-400 mb-2 font-orbitron">Course Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[9px] uppercase tracking-widest text-alt-color/60 block mb-1">Course Name</label>
            <input
              value={parsedCourse?.name || ""}
              onChange={(e) => setParsedCourse(prev => prev ? { ...prev, name: e.target.value } : prev)}
              className="w-full bg-primary/50 border border-prHighlight rounded px-2 py-1.5 text-sm text-secondary focus:outline-none focus:border-secondary transition-all"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-alt-color/60 block mb-1">Professor</label>
            <input
              value={parsedCourse?.prof_name || ""}
              onChange={(e) => setParsedCourse(prev => prev ? { ...prev, prof_name: e.target.value } : prev)}
              className="w-full bg-primary/50 border border-prHighlight rounded px-2 py-1.5 text-sm text-secondary focus:outline-none focus:border-secondary transition-all"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-alt-color/60 block mb-1">Category</label>
            <select
              value={parsedCourse?.category || ""}
              onChange={(e) => setParsedCourse(prev => prev ? { ...prev, category: e.target.value || null } : prev)}
              className="w-full bg-primary/50 border border-prHighlight rounded px-2 py-1.5 text-sm text-secondary focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-primary text-alt-color">Unspecified</option>
              <option value="LE/EECS" className="bg-primary text-secondary">LE/EECS</option>
              <option value="SC/MATH" className="bg-primary text-secondary">SC/MATH</option>
              <option value="SC/CHEM" className="bg-primary text-secondary">SC/CHEM</option>
              <option value="LE/ENG" className="bg-primary text-secondary">LE/ENG</option>
              <option value="SC/PHYS" className="bg-primary text-secondary">SC/PHYS</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-alt-color/60 block mb-1">Semester</label>
            <select
              value={parsedCourse?.semester || "Fall"}
              onChange={(e) => setParsedCourse(prev => prev ? { ...prev, semester: e.target.value } : prev)}
              className="w-full bg-primary/50 border border-prHighlight rounded px-2 py-1.5 text-sm text-secondary focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer"
            >
              <option value="Fall" className="bg-primary text-secondary">Fall</option>
              <option value="Winter" className="bg-primary text-secondary">Winter</option>
              <option value="Full Summer" className="bg-primary text-secondary">Full Summer</option>
              <option value="Summer 1" className="bg-primary text-secondary">Summer 1</option>
              <option value="Summer 2" className="bg-primary text-secondary">Summer 2</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-alt-color/60 block mb-1">Year</label>
            <NumberInput
              value={parsedCourse?.year || new Date().getFullYear()}
              onChange={(e) => setParsedCourse(prev => prev ? { ...prev, year: parseInt(e.target.value) || new Date().getFullYear() } : prev)}
              className="w-full bg-primary/50 border border-prHighlight rounded px-2 py-1.5 text-sm text-secondary focus:outline-none focus:border-secondary transition-all"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-alt-color/60 block mb-1">Credits</label>
            <NumberInput
              value={parsedCourse?.credits || 3}
              step="0.5"
              onChange={(e) => setParsedCourse(prev => prev ? { ...prev, credits: parseFloat(e.target.value) || 3 } : prev)}
              className="w-full bg-primary/50 border border-prHighlight rounded px-2 py-1.5 text-sm text-secondary focus:outline-none focus:border-secondary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Assignments */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-[10px] uppercase tracking-widest text-emerald-400 font-orbitron">
            Graded Components
            <span className={`ml-2 ${Math.abs(totalWeight - 100) < 0.1 ? "text-emerald-400" : "text-amber-400"}`}>
              ({totalWeight.toFixed(1)}% total)
            </span>
          </h3>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[250px] overflow-y-auto pr-1">
          {parsedAssignments.map((a, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-primary/30 border border-prHighlight/50 rounded group">
              <input
                value={a.name}
                onChange={(e) => handleUpdateAssignment(i, "name", e.target.value)}
                className="flex-1 bg-transparent border-none text-sm text-secondary focus:outline-none"
              />
              <div className="flex items-center gap-1 shrink-0">
                <NumberInput
                  value={a.weight}
                  step="0.01"
                  onChange={(e) => handleUpdateAssignment(i, "weight", e.target.value)}
                  className="w-16 bg-primary/50 border border-prHighlight rounded px-1.5 py-0.5 text-xs text-secondary text-right focus:outline-none focus:border-secondary"
                />
                <span className="text-alt-color/40 text-xs">%</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAssignment(i)}
                className="p-1 text-alt-color/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          ))}
        </div>

        {Math.abs(totalWeight - 100) > 0.5 && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            <span className="text-[11px] text-amber-300/80">
              Weights total <span className="font-bold text-amber-300">{totalWeight.toFixed(1)}%</span> — expected 100%. Review and adjust before importing.
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <NeonButton onClick={handleConfirm} className="flex-1 py-3 text-sm">
          Confirm & Import
        </NeonButton>
        <button
          onClick={() => { setPhase("upload"); setParsedCourse(null); setParsedAssignments([]); }}
          className="px-4 py-3 border border-prHighlight hover:border-secondary text-alt-color hover:text-secondary rounded text-xs uppercase tracking-wider transition-all"
        >
          Re-upload
        </button>
      </div>
    </GlassCard>
  );
}
