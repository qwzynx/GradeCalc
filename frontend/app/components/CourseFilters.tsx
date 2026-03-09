"use client";

import React from "react";

interface CourseFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterSemester: string;
  setFilterSemester: (val: string) => void;
  filterYear: string;
  setFilterYear: (val: string) => void;
  filterCategory: string;
  setFilterCategory: (val: string) => void;
  availableSemesters: string[];
  availableYears: number[];
  availableCategories: string[];
}

const CourseFilters: React.FC<CourseFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterSemester,
  setFilterSemester,
  filterYear,
  setFilterYear,
  filterCategory,
  setFilterCategory,
  availableSemesters,
  availableYears,
  availableCategories,
}) => {
  return (
    <div className="mb-12 p-6 rounded-2xl border border-prHighlight/30 bg-primary/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-secondary/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-alt-color/60 font-orbitron text-xs">SEARCH</span>
            <input
              type="text"
              placeholder="Course name, code, or professor..."
              className="w-full bg-primary/60 border border-prHighlight/40 rounded-lg py-4 pl-20 pr-4 text-secondary placeholder:text-alt-color/40 focus:outline-none focus:border-secondary transition-all font-orbitron tracking-wider text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4">
          {/* Semester Filter */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-orbitron text-alt-color uppercase tracking-[0.2em] ml-2">Semester</label>
            <select
              className="bg-primary/60 border border-prHighlight/40 rounded-lg py-2 px-3 text-secondary focus:outline-none focus:border-secondary transition-all font-orbitron text-sm cursor-pointer appearance-none"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
            >
              <option value="All">ALL TERMS</option>
              {availableSemesters.map((s) => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex flex-col gap-1 min-w-[100px]">
            <label className="text-[10px] font-orbitron text-alt-color uppercase tracking-[0.2em] ml-2">Year</label>
            <select
              className="bg-primary/60 border border-prHighlight/40 rounded-lg py-2 px-3 text-secondary focus:outline-none focus:border-secondary transition-all font-orbitron text-sm cursor-pointer appearance-none"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="All">ALL YEARS</option>
              {availableYears.map((y) => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-[10px] font-orbitron text-alt-color uppercase tracking-[0.2em] ml-2">Hub</label>
            <select
              className="bg-primary/60 border border-prHighlight/40 rounded-lg py-2 px-3 text-secondary focus:outline-none focus:border-secondary transition-all font-orbitron text-sm cursor-pointer appearance-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">ALL HUBS</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Active Filters Summary (Optional) */}
      {(searchTerm || filterSemester !== "All" || filterYear !== "All" || filterCategory !== "All") && (
        <div className="flex items-center gap-3 pt-4 border-t border-prHighlight/20">
          <span className="text-[10px] font-orbitron text-alt-color uppercase tracking-widest">Active Filters:</span>
          <div className="flex flex-wrap gap-2">
            {searchTerm && <FilterBadge label={`Search: ${searchTerm}`} onClear={() => setSearchTerm("")} />}
            {filterSemester !== "All" && <FilterBadge label={`Term: ${filterSemester}`} onClear={() => setFilterSemester("All")} />}
            {filterYear !== "All" && <FilterBadge label={`Year: ${filterYear}`} onClear={() => setFilterYear("All")} />}
            {filterCategory !== "All" && <FilterBadge label={`Hub: ${filterCategory}`} onClear={() => setFilterCategory("All")} />}
          </div>
          <button 
            onClick={() => {
              setSearchTerm("");
              setFilterSemester("All");
              setFilterYear("All");
              setFilterCategory("All");
            }}
            className="ml-auto text-[10px] font-orbitron text-secondary hover:text-white transition-colors uppercase tracking-[0.2em]"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

const FilterBadge = ({ label, onClear }: { label: string; onClear: () => void }) => (
  <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/30 rounded-full px-3 py-1">
    <span className="text-[10px] font-orbitron text-secondary uppercase tracking-wider">{label}</span>
    <button onClick={onClear} className="text-secondary hover:text-white transition-colors">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

export default CourseFilters;
