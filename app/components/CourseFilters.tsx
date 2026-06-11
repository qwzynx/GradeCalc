"use client";

import React from "react";
import { Search, X, Check } from "lucide-react";

interface CourseFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterSemester: string[];
  setFilterSemester: React.Dispatch<React.SetStateAction<string[]>>;
  filterYear: string[];
  setFilterYear: React.Dispatch<React.SetStateAction<string[]>>;
  filterAcademicYear: number[];
  setFilterAcademicYear: React.Dispatch<React.SetStateAction<number[]>>;
  filterCategory: string[];
  setFilterCategory: React.Dispatch<React.SetStateAction<string[]>>;
  filterInProgress: boolean;
  setFilterInProgress: (val: boolean) => void;
  availableSemesters: string[];
  availableYears: number[];
  availableAcademicYears: number[];
  availableCategories: string[];
}

const CourseFilters: React.FC<CourseFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterSemester,
  setFilterSemester,
  filterYear,
  setFilterYear,
  filterAcademicYear,
  setFilterAcademicYear,
  filterCategory,
  setFilterCategory,
  filterInProgress,
  setFilterInProgress,
  availableSemesters,
  availableYears,
  availableAcademicYears,
  availableCategories,
}) => {
  const toggleFilter = (
    current: any[],
    setFn: React.Dispatch<React.SetStateAction<any[]>>,
    val: any
  ) => {
    if (current.includes(val)) {
      setFn(current.filter((item) => item !== val));
    } else {
      setFn([...current, val]);
    }
  };

  return (
    <div className="mb-12 p-6 rounded-2xl border border-black/10 bg-white shadow-md flex flex-col gap-8">
      {/* Search Input */}
      <div className="relative group max-w-2xl">
        <div className="absolute inset-0 bg-black/5 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search courses by name, code, or professor..."
            className="w-full bg-white border border-black/20 rounded-xl py-5 pl-12 pr-4 text-secondary placeholder:text-muted focus:outline-none focus:border-primary transition-all font-orbitron tracking-wider text-sm shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 text-muted hover:text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Status Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-orbitron text-muted uppercase tracking-[0.2em]">Status</label>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterCheckbox
              label="In Progress Only"
              checked={filterInProgress}
              onChange={() => setFilterInProgress(!filterInProgress)}
            />
          </div>
        </div>

        {/* Academic Year Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-orbitron text-muted uppercase tracking-[0.2em]">Academic Year</label>
            {filterAcademicYear.length > 0 && (
               <button onClick={() => setFilterAcademicYear([])} className="text-[9px] text-primary font-semibold hover:underline uppercase tracking-widest opacity-60 hover:opacity-100">Reset</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableAcademicYears.map((ay) => (
               <FilterCheckbox
                 key={ay}
                 label={`${ay}-${ay + 1}`}
                 checked={filterAcademicYear.includes(ay)}
                 onChange={() => toggleFilter(filterAcademicYear, setFilterAcademicYear, ay)}
               />
            ))}
            {availableAcademicYears.length === 0 && <span className="text-[10px] text-muted/60 uppercase italic">No Years Found</span>}
          </div>
        </div>

        {/* Semester Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-orbitron text-muted uppercase tracking-[0.2em]">Semester</label>
            {filterSemester.length > 0 && (
               <button onClick={() => setFilterSemester([])} className="text-[9px] text-primary font-semibold hover:underline uppercase tracking-widest opacity-60 hover:opacity-100">Reset</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableSemesters.map((s) => (
              <FilterCheckbox
                key={s}
                label={s}
                checked={filterSemester.includes(s)}
                onChange={() => toggleFilter(filterSemester, setFilterSemester, s)}
              />
            ))}
            {availableSemesters.length === 0 && <span className="text-[10px] text-muted/60 uppercase italic">No Semesters Found</span>}
          </div>
        </div>

        {/* Year Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-orbitron text-muted uppercase tracking-[0.2em]">Year</label>
            {filterYear.length > 0 && (
               <button onClick={() => setFilterYear([])} className="text-[9px] text-primary font-semibold hover:underline uppercase tracking-widest opacity-60 hover:opacity-100">Reset</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableYears.map((y) => (
              <FilterCheckbox
                key={y}
                label={y.toString()}
                checked={filterYear.includes(y.toString())}
                onChange={() => toggleFilter(filterYear, setFilterYear, y.toString())}
              />
            ))}
            {availableYears.length === 0 && <span className="text-[10px] text-muted/60 uppercase italic">No Years Found</span>}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-orbitron text-muted uppercase tracking-[0.2em]">Category</label>
            {filterCategory.length > 0 && (
               <button onClick={() => setFilterCategory([])} className="text-[9px] text-primary font-semibold hover:underline uppercase tracking-widest opacity-60 hover:opacity-100">Reset</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((c) => (
              <FilterCheckbox
                key={c}
                label={c}
                checked={filterCategory.includes(c)}
                onChange={() => toggleFilter(filterCategory, setFilterCategory, c)}
              />
            ))}
            {availableCategories.length === 0 && <span className="text-[10px] text-muted/60 uppercase italic">No Categories Found</span>}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(searchTerm || filterSemester.length > 0 || filterYear.length > 0 || filterAcademicYear.length > 0 || filterCategory.length > 0 || filterInProgress) && (
        <div className="flex flex-col gap-4 pt-6 border-t border-black/10 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[10px] font-orbitron text-muted uppercase tracking-[0.2em]">Active Filters</span>
            </div>
            <button 
              onClick={() => {
                setSearchTerm("");
                setFilterSemester([]);
                setFilterYear([]);
                setFilterAcademicYear([]);
                setFilterCategory([]);
                setFilterInProgress(false);
              }}
              className="text-[9px] font-orbitron text-primary font-bold hover:bg-primary/10 transition-all uppercase tracking-[0.2em] border border-primary/20 rounded px-2 py-1"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchTerm && <FilterBadge label={`Search: ${searchTerm}`} onClear={() => setSearchTerm("")} />}
            {filterInProgress && <FilterBadge label="In Progress" onClear={() => setFilterInProgress(false)} />}
            {filterAcademicYear.map(ay => <FilterBadge key={ay} label={`${ay}-${ay+1}`} onClear={() => toggleFilter(filterAcademicYear, setFilterAcademicYear, ay)} />)}
            {filterSemester.map(s => <FilterBadge key={s} label={s} onClear={() => toggleFilter(filterSemester, setFilterSemester, s)} />)}
            {filterYear.map(y => <FilterBadge key={y} label={y} onClear={() => toggleFilter(filterYear, setFilterYear, y)} />)}
            {filterCategory.map(c => <FilterBadge key={c} label={c} onClear={() => toggleFilter(filterCategory, setFilterCategory, c)} />)}
          </div>
        </div>
      )}
    </div>
  );
};

const FilterCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`group flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all duration-300 ${
      checked 
        ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm' 
        : 'bg-white border-black/20 text-muted hover:border-primary hover:text-primary'
    }`}
  >
    <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
      checked ? 'bg-primary border-primary' : 'bg-transparent border-black/20 group-hover:border-primary'
    }`}>
      {checked && <Check className="w-2.5 h-2.5 text-[#FFFFFF] stroke-[4px]" />}
    </div>
    <span className="text-[10px] font-orbitron uppercase tracking-widest leading-none">{label}</span>
  </button>
);

const FilterBadge = ({ label, onClear }: { label: string; onClear: () => void }) => (
  <div className="flex items-center gap-2 bg-primary/5 dark:bg-primary/10 border border-primary/30 rounded-lg px-2 py-1 animate-in zoom-in-95 duration-200">
    <span className="text-[9px] font-orbitron text-primary font-semibold uppercase tracking-wider">{label}</span>
    <button onClick={onClear} className="text-primary hover:text-red-700 transition-colors">
      <X className="w-3 h-3" />
    </button>
  </div>
);

export default CourseFilters;
