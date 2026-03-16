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
    <div className="mb-12 p-6 rounded-2xl border border-prHighlight/30 bg-primary/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-8">
      {/* Search Input */}
      <div className="relative group max-w-2xl">
        <div className="absolute inset-0 bg-secondary/10 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-alt-color/60" />
          <input
            type="text"
            placeholder="Search databanks by name, code, or professor..."
            className="w-full bg-primary/60 border border-prHighlight/40 rounded-xl py-5 pl-12 pr-4 text-secondary placeholder:text-alt-color/40 focus:outline-none focus:border-secondary transition-all font-orbitron tracking-wider text-sm shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 text-alt-color/60 hover:text-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Status Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-orbitron text-alt-color uppercase tracking-[0.2em]">Live Status</label>
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
            <label className="text-[11px] font-orbitron text-alt-color uppercase tracking-[0.2em]">Academic Cycle</label>
            {filterAcademicYear.length > 0 && (
               <button onClick={() => setFilterAcademicYear([])} className="text-[9px] text-secondary hover:underline uppercase tracking-widest opacity-60 hover:opacity-100">Reset</button>
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
            {availableAcademicYears.length === 0 && <span className="text-[10px] text-alt-color/40 uppercase italic">No Cycles Detected</span>}
          </div>
        </div>

        {/* Semester Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-orbitron text-alt-color uppercase tracking-[0.2em]">Term Phase</label>
            {filterSemester.length > 0 && (
               <button onClick={() => setFilterSemester([])} className="text-[9px] text-secondary hover:underline uppercase tracking-widest opacity-60 hover:opacity-100">Reset</button>
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
            {availableSemesters.length === 0 && <span className="text-[10px] text-alt-color/40 uppercase italic">No Terms Detected</span>}
          </div>
        </div>

        {/* Year Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-orbitron text-alt-color uppercase tracking-[0.2em]">Temporal Axis</label>
            {filterYear.length > 0 && (
               <button onClick={() => setFilterYear([])} className="text-[9px] text-secondary hover:underline uppercase tracking-widest opacity-60 hover:opacity-100">Reset</button>
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
            {availableYears.length === 0 && <span className="text-[10px] text-alt-color/40 uppercase italic">No Years Detected</span>}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-[11px] font-orbitron text-alt-color uppercase tracking-[0.2em]">Stream Protocol</label>
            {filterCategory.length > 0 && (
               <button onClick={() => setFilterCategory([])} className="text-[9px] text-secondary hover:underline uppercase tracking-widest opacity-60 hover:opacity-100">Reset</button>
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
            {availableCategories.length === 0 && <span className="text-[10px] text-alt-color/40 uppercase italic">No Streams Detected</span>}
          </div>
        </div>
      </div>
      
      {/* Active Filters Summary */}
      {(searchTerm || filterSemester.length > 0 || filterYear.length > 0 || filterAcademicYear.length > 0 || filterCategory.length > 0 || filterInProgress) && (
        <div className="flex items-center gap-4 pt-6 border-t border-prHighlight/20">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></div>
            <span className="text-[10px] font-orbitron text-alt-color uppercase tracking-[0.2em]">Active Matrix:</span>
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {searchTerm && <FilterBadge label={`Search: ${searchTerm}`} onClear={() => setSearchTerm("")} />}
            {filterInProgress && <FilterBadge label="In Progress" onClear={() => setFilterInProgress(false)} />}
            {filterAcademicYear.map(ay => <FilterBadge key={ay} label={`${ay}-${ay+1}`} onClear={() => toggleFilter(filterAcademicYear, setFilterAcademicYear, ay)} />)}
            {filterSemester.map(s => <FilterBadge key={s} label={s} onClear={() => toggleFilter(filterSemester, setFilterSemester, s)} />)}
            {filterYear.map(y => <FilterBadge key={y} label={y} onClear={() => toggleFilter(filterYear, setFilterYear, y)} />)}
            {filterCategory.map(c => <FilterBadge key={c} label={c} onClear={() => toggleFilter(filterCategory, setFilterCategory, c)} />)}
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
            className="text-[10px] font-orbitron text-secondary hover:text-white transition-all uppercase tracking-[0.2em] border border-secondary/30 rounded px-3 py-1 hover:bg-secondary/10"
          >
            Purge All
          </button>
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
        ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_10px_rgba(242,166,90,0.2)]' 
        : 'bg-primary/20 border-prHighlight/40 text-alt-color hover:border-secondary/50 hover:text-secondary'
    }`}
  >
    <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
      checked ? 'bg-secondary border-secondary' : 'bg-transparent border-prHighlight/40 group-hover:border-secondary/50'
    }`}>
      {checked && <Check className="w-2.5 h-2.5 text-primary stroke-[4px]" />}
    </div>
    <span className="text-[10px] font-orbitron uppercase tracking-widest leading-none">{label}</span>
  </button>
);

const FilterBadge = ({ label, onClear }: { label: string; onClear: () => void }) => (
  <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/30 rounded-lg px-2 py-1 animate-in zoom-in-95 duration-200">
    <span className="text-[9px] font-orbitron text-secondary uppercase tracking-wider">{label}</span>
    <button onClick={onClear} className="text-secondary hover:text-white transition-colors">
      <X className="w-3 h-3" />
    </button>
  </div>
);

export default CourseFilters;
