"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NeonButton from "./components/NeonButton";
import DashboardMetrics from "./components/DashboardMetrics";
import AddCourseForm from "./components/AddCourseForm";
import EclassSync from "./components/EclassSync";
import SyllabusImport from "./components/SyllabusImport";
import CourseCard from "./components/CourseCard";
import CourseFilters from "./components/CourseFilters";
import { Course, Assignment, EclassSyncPlan } from "./types";
import AnimatedOverlay from "./components/AnimatedOverlay";
import HeaderControls from "./components/HeaderControls";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { RefreshCw, SlidersHorizontal, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateCumulativeGPA4_0, calculateGrades } from "@/lib/calculations";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEclassSync, setShowEclassSync] = useState(false);
  const [showSyllabusImport, setShowSyllabusImport] = useState(false);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState<string[]>([]);
  const [filterYear, setFilterYear] = useState<string[]>([]);
  const [filterAcademicYear, setFilterAcademicYear] = useState<number[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterInProgress, setFilterInProgress] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // Below lg the filter panel would push every course card off the first
  // screen, so it collapses behind a toggle. At lg+ the sidebar is always open.
  const [showFilters, setShowFilters] = useState(false);

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem("gradeMatrixFilters");
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (parsed.searchTerm) setSearchTerm(parsed.searchTerm);
        if (parsed.filterSemester) setFilterSemester(parsed.filterSemester);
        if (parsed.filterYear) setFilterYear(parsed.filterYear);
        if (parsed.filterAcademicYear) setFilterAcademicYear(parsed.filterAcademicYear);
        if (parsed.filterCategory) setFilterCategory(parsed.filterCategory);
        if (typeof parsed.filterInProgress === 'boolean') setFilterInProgress(parsed.filterInProgress);
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (!isInitialized) return;
    
    const filtersToSave = {
      searchTerm,
      filterSemester,
      filterYear,
      filterAcademicYear,
      filterCategory,
      filterInProgress
    };
    localStorage.setItem("gradeMatrixFilters", JSON.stringify(filtersToSave));
  }, [searchTerm, filterSemester, filterYear, filterAcademicYear, filterCategory, filterInProgress, isInitialized]);
  
  const userId = user?.id;

  const fetchCourses = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, assignments(*)')
        .eq('user_id', userId);

      if (error) throw error;
      
      const loadedCourses = data || [];
      setCourses(loadedCourses);

      const assignData: Record<string, Assignment[]> = {};
      loadedCourses.forEach((course: any) => {
        if (course.id) {
          assignData[course.id] = course.assignments || [];
        }
      });
      setAssignments(assignData);
    } catch (error) {
      console.error("Error fetching courses", error);
      showToast("Could not load your courses. Check your connection and refresh.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCourses();
    }
  }, [userId]);

  const handleAddCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newCourse: Partial<Course> = {
      user_id: userId,
      name: formData.get("name") as string,
      year: parseInt(formData.get("year") as string) || new Date().getFullYear(),
      semester: formData.get("semester") as string || "Fall",
      in_progress: formData.get("in_progress") === "on",
    };

    const profName = formData.get("prof_name") as string;
    if (profName) newCourse.prof_name = profName;
    
    const category = formData.get("category") as string;
    if (category) newCourse.category = category;

    const credits = formData.get("credits") as string;
    if (credits) newCourse.credits = parseFloat(credits);

    try {
      const { error } = await supabase
        .from('courses')
        .insert([newCourse]);
        
      if (error) throw error;

      setShowAddForm(false);
      fetchCourses();
      showToast(`Added ${newCourse.name}`);
    } catch (error) {
      console.error("Error adding course", error);
      showToast("Could not add the course. Please try again.", "error");
    }
  };

  const handleSyllabusImport = async (
    courseData: { name: string; prof_name?: string; semester?: string; year?: number; credits?: number; category?: string | null },
    assignmentsData: { name: string; weight: number }[]
  ) => {
    try {
      const newCourse: Partial<Course> = {
        user_id: userId,
        name: courseData.name,
        year: courseData.year || new Date().getFullYear(),
        semester: courseData.semester || "Fall",
        in_progress: true,
      };
      if (courseData.prof_name) newCourse.prof_name = courseData.prof_name;
      if (courseData.category) newCourse.category = courseData.category;
      if (courseData.credits) newCourse.credits = courseData.credits;

      const { data, error } = await supabase
        .from('courses')
        .insert([newCourse])
        .select();

      if (error) throw error;

      const courseId = data?.[0]?.id;
      if (courseId && assignmentsData.length > 0) {
        const assignmentsToInsert = assignmentsData.map(a => ({
          course_id: courseId,
          name: a.name,
          weight: a.weight,
          mark: null,
        }));

        const { error: assignError } = await supabase
          .from('assignments')
          .insert(assignmentsToInsert);

        if (assignError) throw assignError;
      }

      setShowSyllabusImport(false);
      fetchCourses();
      showToast(`Imported ${newCourse.name} from syllabus`);
    } catch (error) {
      console.error("Error importing syllabus", error);
      showToast("Could not import the syllabus. Please try again.", "error");
    }
  };

  // Postgres "undefined_column" — only true when the eclass migration hasn't
  // been run yet. Anything else (e.g. a unique-constraint violation from the
  // dedup indexes) must NOT be masked by stripping the sync key and retrying,
  // since that would silently create a duplicate row.
  const isMissingColumnError = (error: any) => error?.code === "42703";

  const handleEclassApply = async (plan: EclassSyncPlan) => {
    let updated = 0;
    let created = 0;
    let coursesCreated = 0;

    for (const course of plan.courses) {
      let targetCourseId = course.app_course_id;

      // Courses the AI drafted from eClass that don't exist in the app yet —
      // create them first so their assignments have somewhere to land.
      if (!targetCourseId && course.suggested_course) {
        // Defense-in-depth: a prior sync may have already created and linked
        // this eClass course even if this plan's match missed it — never
        // insert a duplicate course row for an id we've already imported.
        const { data: existing } = await supabase
          .from('courses')
          .select('id')
          .eq('user_id', userId)
          .eq('eclass_course_id', course.eclass_course_id)
          .maybeSingle();

        if (existing?.id) {
          targetCourseId = existing.id;
        } else {
          const sc = course.suggested_course;
          const newCourse: Partial<Course> = {
            user_id: userId,
            name: sc.name,
            year: sc.year || new Date().getFullYear(),
            semester: sc.semester || "Fall",
            in_progress: true,
            eclass_course_id: course.eclass_course_id,
          };
          if (sc.prof_name) newCourse.prof_name = sc.prof_name;
          if (sc.category) newCourse.category = sc.category;
          if (sc.credits) newCourse.credits = sc.credits;

          let { data, error } = await supabase.from('courses').insert([newCourse]).select();
          if (error && isMissingColumnError(error)) {
            delete newCourse.eclass_course_id;
            ({ data, error } = await supabase.from('courses').insert([newCourse]).select());
          }
          if (error) throw error;

          targetCourseId = data?.[0]?.id ?? null;
          if (targetCourseId) coursesCreated++;
        }
      }

      if (!targetCourseId) continue;

      for (const item of course.items) {
        if (item.action === "update" && item.assignment_id) {
          let { error } = await supabase
            .from('assignments')
            .update({ mark: item.new_mark, eclass_item_name: item.eclass_item_name })
            .eq('id', item.assignment_id);

          // Retry without the sync key if the eclass migration hasn't been run yet
          if (error && isMissingColumnError(error)) {
            ({ error } = await supabase
              .from('assignments')
              .update({ mark: item.new_mark })
              .eq('id', item.assignment_id));
          }
          if (error) throw error;
          updated++;
        } else if (item.action === "create") {
          const newAssignment: Partial<Assignment> = {
            course_id: targetCourseId,
            name: item.assignment_name || item.eclass_item_name,
            mark: item.new_mark,
            eclass_item_name: item.eclass_item_name,
          };
          if (item.weight !== null && item.weight !== undefined) newAssignment.weight = item.weight;

          let { error } = await supabase.from('assignments').insert([newAssignment]);
          if (error && isMissingColumnError(error)) {
            delete newAssignment.eclass_item_name;
            ({ error } = await supabase.from('assignments').insert([newAssignment]));
          }
          if (error) throw error;
          created++;
        }
      }

      await supabase
        .from('courses')
        .update({ eclass_course_id: course.eclass_course_id })
        .eq('id', targetCourseId)
        .eq('user_id', userId);
    }

    // Snapshot the sync so there's a history of what was scraped and applied
    const { error: logError } = await supabase.from('eclass_syncs').insert([{
      user_id: userId,
      courses_matched: plan.courses.filter(c => c.app_course_id).length,
      items_updated: updated,
      items_created: created,
      snapshot: plan,
    }]);
    if (logError) console.warn("Could not log eClass sync (run the eclass_syncs migration?)", logError);

    await fetchCourses();
    return { updated, created, coursesCreated };
  };

  const calculateGrade = (courseId: string) => {
    const courseAssigns = assignments[courseId] || [];

    // Bonuses alone don't make a grade — there has to be graded coursework
    // for them to sit on top of.
    const hasGradedWork = courseAssigns.some(
      a => !a.is_bonus && a.mark !== undefined && a.mark !== null && a.weight !== undefined && a.weight !== null
    );
    if (!hasGradedWork) return null;

    const { final_average } = calculateGrades(
      courseAssigns.map(a => ({ percentage: a.mark, weight: a.weight, is_bonus: a.is_bonus }))
    );
    return final_average.toFixed(1);
  };

  const getYorkUGrade = (percentage: number | null) => {
    if (percentage === null || percentage === undefined) return { letter: 'N/A', gpa: null };
    if (percentage >= 90) return { letter: 'A+', gpa: 9.0 };
    if (percentage >= 80) return { letter: 'A', gpa: 8.0 };
    if (percentage >= 75) return { letter: 'B+', gpa: 7.0 };
    if (percentage >= 70) return { letter: 'B', gpa: 6.0 };
    if (percentage >= 65) return { letter: 'C+', gpa: 5.0 };
    if (percentage >= 60) return { letter: 'C', gpa: 4.0 };
    if (percentage >= 55) return { letter: 'D+', gpa: 3.0 };
    if (percentage >= 50) return { letter: 'D', gpa: 2.0 };
    return { letter: 'F', gpa: 0.0 };
  };

  const getYorkUGrade4_0 = (percentage: number | null) => {
    if (percentage === null || percentage === undefined) return { letter: 'N/A', gpa: null };
    if (percentage >= 90) return { letter: 'A+', gpa: 4.00 };
    if (percentage >= 85) return { letter: 'A', gpa: 3.90 };
    if (percentage >= 80) return { letter: 'A-', gpa: 3.70 };
    if (percentage >= 77) return { letter: 'B+', gpa: 3.30 };
    if (percentage >= 73) return { letter: 'B', gpa: 3.00 };
    if (percentage >= 70) return { letter: 'B-', gpa: 2.70 };
    if (percentage >= 67) return { letter: 'C+', gpa: 2.30 };
    if (percentage >= 63) return { letter: 'C', gpa: 2.00 };
    if (percentage >= 60) return { letter: 'C-', gpa: 1.70 };
    if (percentage >= 57) return { letter: 'D+', gpa: 1.30 };
    if (percentage >= 53) return { letter: 'D', gpa: 1.00 };
    if (percentage >= 50) return { letter: 'D-', gpa: 0.70 };
    return { letter: 'F', gpa: 0.00 };
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm || 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (course.prof_name && course.prof_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.category && course.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSemester = filterSemester.length === 0 || filterSemester.includes(course.semester);
    const matchesYear = filterYear.length === 0 || filterYear.includes(course.year.toString());
    const matchesAcademicYear = filterAcademicYear.length === 0 || filterAcademicYear.includes(
      course.semester === "Fall" ? course.year : course.year - 1
    );
    const matchesCategory = filterCategory.length === 0 || (course.category && filterCategory.includes(course.category));
    const matchesInProgress = !filterInProgress || course.in_progress;

    return matchesSearch && matchesSemester && matchesYear && matchesAcademicYear && matchesCategory && matchesInProgress;
  }).sort((a, b) => {
    // 1. In Progress status (true first)
    if (a.in_progress !== b.in_progress) {
      return a.in_progress ? -1 : 1;
    }
    
    // 2. Year (descending)
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    
    // 3. Semester (descending)
    const semesterOrder: Record<string, number> = {
      'Fall': 5,
      'Summer 2': 4,
      'Full Summer': 3,
      'Summer 1': 2,
      'Winter': 1
    };
    return (semesterOrder[b.semester] || 0) - (semesterOrder[a.semester] || 0);
  });

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    (filterInProgress ? 1 : 0) +
    filterSemester.length +
    filterYear.length +
    filterAcademicYear.length +
    filterCategory.length;

  const availableSemesters = Array.from(new Set(courses.map(c => c.semester))).sort();
  const availableYears = Array.from(new Set(courses.map(c => c.year))).sort((a, b) => b - a);
  const availableAcademicYears = Array.from(new Set(courses.map(c => 
    c.semester === "Fall" ? c.year : c.year - 1
  ))).sort((a, b) => b - a);
  const availableCategories = Array.from(new Set(courses.map(c => c.category || "Uncategorized"))).filter(c => c !== "Uncategorized").sort();

  const calculateDashboardData = (dataToCalculate: Course[]) => {
    let totalCredits = 0;
    let earnedPoints9 = 0;
    const coursesFor4_0: { letter: string, credits: number }[] = [];
    const letterCounts: Record<string, number> = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
    };
    const letterCredits: Record<string, number> = {
      'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
    };

    const semesterOrder: Record<string, number> = {
      'Winter': 1,
      'Summer 1': 2,
      'Full Summer': 3,
      'Summer 2': 4,
      'Fall': 5
    };

    const timelineDataMap: Record<string, { totalMark: number, count: number, order: number }> = {};

    dataToCalculate.forEach(course => {
      let finalPercentage = null;
      if (course.mark !== undefined && course.mark !== null) {
        finalPercentage = course.mark;
      } else if (course.id) {
        const calculated = calculateGrade(course.id);
        if (calculated !== null) {
          finalPercentage = parseFloat(calculated);
        }
      }

      if (finalPercentage !== null) {
        const timeKey = `${course.semester} ${course.year}`;
        if (!timelineDataMap[timeKey]) {
           timelineDataMap[timeKey] = {
             totalMark: 0,
             count: 0,
             order: course.year * 10 + (semesterOrder[course.semester] || 0)
           };
        }
        timelineDataMap[timeKey].totalMark += finalPercentage;
        timelineDataMap[timeKey].count += 1;

        const gradeInfo9 = getYorkUGrade(finalPercentage);
        const gradeInfo4 = getYorkUGrade4_0(finalPercentage);
        if (gradeInfo9.gpa !== null && gradeInfo4.gpa !== null) {
          const credits = course.credits || 3;
          totalCredits += credits;
          earnedPoints9 += gradeInfo9.gpa * credits;
          coursesFor4_0.push({ letter: gradeInfo4.letter, credits });
          // Use 9.0 letter grades for pie chart to prevent minus grades showing
          letterCounts[gradeInfo9.letter] = (letterCounts[gradeInfo9.letter] || 0) + 1;
          letterCredits[gradeInfo9.letter] = (letterCredits[gradeInfo9.letter] || 0) + credits;
        }
      }
    });

    const averageGpa = totalCredits > 0 ? (earnedPoints9 / totalCredits).toFixed(2) : "0.00";
    const averageGpa4_0 = calculateCumulativeGPA4_0(coursesFor4_0);
    
    const pieData = Object.entries(letterCounts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value, credits: letterCredits[name] || 0 }));

    const lineData = Object.entries(timelineDataMap)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([name, data]) => ({
        name,
        mark: parseFloat((data.totalMark / data.count).toFixed(2))
      }));

    return { averageGpa, averageGpa4_0, pieData, lineData };
  };

  const { averageGpa, averageGpa4_0, pieData, lineData } = calculateDashboardData(filteredCourses);
  const activeCourseCount = filteredCourses.filter(c => c.in_progress).length;
  const totalCreditsCount = filteredCourses.reduce((sum, c) => sum + (c.credits || 3), 0);

  if (authLoading || (loading && !userId)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
         <div className="h-16 w-16 rounded-full border-4 border-black/10 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh app-shell mx-auto w-full max-w-[1800px]">
      {/* Two rows below lg (title + system controls, then the action group),
          collapsing to a single row once there's width for it at lg. */}
      <header className="mb-8 sm:mb-10 lg:mb-12 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-black/10 pb-5 sm:pb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-orbitron tracking-wider sm:tracking-widest text-primary">
            GradeMatrix
          </h1>
          <div className="flex items-center gap-2 lg:hidden">
            <HeaderControls />
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-4">
          {/* Main Action Group */}
          <div className="flex flex-1 lg:flex-none items-center gap-1 bg-black/5 p-1 rounded-2xl border border-black/5 shadow-inner">
            <NeonButton
              onClick={() => setShowAddForm(true)}
              className="flex-1 lg:flex-none !py-2 !px-3 sm:!px-6 !rounded-xl !text-[10px] sm:!text-xs shadow-none hover:shadow-md whitespace-nowrap"
            >
              Add Course
            </NeonButton>
            <button
              onClick={() => setShowSyllabusImport(true)}
              className="group flex flex-1 lg:flex-none items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl hover:bg-white transition-all duration-300 min-h-[44px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted group-hover:text-primary transition-colors">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
              </svg>
              <span className="text-[10px] sm:text-xs font-orbitron font-semibold text-secondary group-hover:text-primary transition-colors uppercase tracking-wider">AI Import</span>
            </button>
            <button
              onClick={() => setShowEclassSync(true)}
              className="group flex flex-1 lg:flex-none items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl hover:bg-white transition-all duration-300 min-h-[44px]"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0 text-muted group-hover:text-primary group-hover:rotate-90 transition-all" />
              <span className="text-[10px] sm:text-xs font-orbitron font-semibold text-secondary group-hover:text-primary transition-colors uppercase tracking-wider">Sync</span>
            </button>
          </div>

          <div className="hidden lg:block w-px h-8 bg-black/10" />

          <div className="hidden lg:flex items-center gap-2">
            <HeaderControls showLabel />
          </div>
        </div>
      </header>

      <main>
        {!loading && courses.length > 0 && (
          <DashboardMetrics
            averageGpa={averageGpa}
            averageGpa4_0={averageGpa4_0}
            pieData={pieData}
            lineData={lineData}
            totalCourses={filteredCourses.length}
            activeCourses={activeCourseCount}
            totalCredits={totalCreditsCount}
          />
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {!loading && courses.length > 0 && (
            <div className="w-full lg:w-1/4 xl:w-1/5 shrink-0 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-1">
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                aria-expanded={showFilters}
                className="lg:hidden w-full mb-4 flex items-center justify-between gap-3 px-4 py-3 min-h-[48px] rounded-2xl border border-black/10 bg-white shadow-sm text-secondary"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-muted" />
                  <span className="text-xs font-orbitron font-bold uppercase tracking-widest">Search &amp; Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-[10px] font-bold text-[#FFFFFF] tabular-nums">
                      {activeFilterCount}
                    </span>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`} />
              </button>

              <div className={showFilters ? "block" : "hidden lg:block"}>
              <CourseFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterSemester={filterSemester}
                setFilterSemester={setFilterSemester}
                filterYear={filterYear}
                setFilterYear={setFilterYear}
                filterAcademicYear={filterAcademicYear}
                setFilterAcademicYear={setFilterAcademicYear}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                filterInProgress={filterInProgress}
                setFilterInProgress={setFilterInProgress}
                availableSemesters={availableSemesters}
                availableYears={availableYears}
                availableAcademicYears={availableAcademicYears}
                availableCategories={availableCategories}
              />
              </div>
            </div>
          )}

          <div className="w-full flex-1 min-w-0">
            <AnimatedOverlay open={showAddForm} onClose={() => setShowAddForm(false)} width="2xl">
              <AddCourseForm
                onSubmit={handleAddCourse}
                onCancel={() => setShowAddForm(false)}
              />
            </AnimatedOverlay>

            <AnimatedOverlay open={showSyllabusImport} onClose={() => setShowSyllabusImport(false)} width="2xl">
              <SyllabusImport
                onImport={handleSyllabusImport}
                onCancel={() => setShowSyllabusImport(false)}
              />
            </AnimatedOverlay>

            <AnimatedOverlay open={showEclassSync} onClose={() => setShowEclassSync(false)} width="4xl">
              <EclassSync
                courses={courses}
                assignments={assignments}
                onApply={handleEclassApply}
                onCancel={() => setShowEclassSync(false)}
              />
            </AnimatedOverlay>

            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-black/10 border-t-primary animate-spin"></div>
                  <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-b-primary animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20 sm:py-32 text-muted flex flex-col items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mb-6 rounded-full border border-black/10 flex items-center justify-center bg-white shadow-sm relative">
                   <div className="absolute inset-2 border border-dashed border-primary rounded-full animate-spin-slow"></div>
                   <span className="text-3xl text-primary font-bold">Ø</span>
                </div>
                <p className="text-lg sm:text-xl font-orbitron tracking-widest text-secondary font-bold">No courses yet.</p>
                <p className="mt-2 text-xs sm:text-sm uppercase tracking-wider opacity-70 max-w-md text-balance">Add a course manually, import a syllabus, or pull everything in from eClass.</p>
                <div className="mt-8 w-full max-w-sm sm:max-w-none flex flex-col sm:flex-row sm:justify-center items-stretch sm:items-center gap-3">
                  <NeonButton onClick={() => setShowAddForm(true)}>Add Your First Course</NeonButton>
                  <button
                    onClick={() => setShowSyllabusImport(true)}
                    className="group flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-white shadow-sm border border-black/10 hover:border-primary transition-all duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-primary transition-colors">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                    </svg>
                    <span className="text-xs font-orbitron font-semibold text-secondary group-hover:text-primary transition-colors uppercase tracking-wider">Import Syllabus</span>
                  </button>
                  <button
                    onClick={() => setShowEclassSync(true)}
                    className="group flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-white shadow-sm border border-black/10 hover:border-primary transition-all duration-300"
                  >
                    <RefreshCw className="w-4 h-4 text-muted group-hover:text-primary group-hover:rotate-90 transition-all" />
                    <span className="text-xs font-orbitron font-semibold text-secondary group-hover:text-primary transition-colors uppercase tracking-wider">Sync from eClass</span>
                  </button>
                </div>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center">
                 <div className="w-16 h-16 mb-4 rounded-full border border-black/10 flex items-center justify-center bg-white shadow-sm">
                   <span className="text-xl opacity-50 text-primary font-orbitron font-bold">!</span>
                </div>
                <p className="text-lg font-orbitron tracking-widest text-primary font-bold">No results found for current filters.</p>
                <button 
                  onClick={() => {
                    setSearchTerm("");
                    setFilterSemester([]);
                    setFilterYear([]);
                    setFilterAcademicYear([]);
                    setFilterCategory([]);
                    setFilterInProgress(false);
                  }}
                  className="mt-4 text-secondary font-semibold hover:text-primary hover:underline cursor-pointer font-orbitron text-xs uppercase tracking-widest transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-10 sm:gap-12">
                {(() => {
                  const groupedCourses = filteredCourses.reduce((acc, course) => {
                    const category = course.category && course.category.trim() !== "" ? course.category : "Uncategorized";
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(course);
                    return acc;
                  }, {} as Record<string, Course[]>);

                  return Object.keys(groupedCourses).sort().map(category => (
                    <div key={category} className="flex flex-col gap-5 sm:gap-6">
                      <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-secondary border-b border-black/10 pb-2 break-words">{category}</h2>
                      {/* The sidebar eats a quarter of the row at lg, so a third
                          column only earns its place from xl up. */}
                      <div className="grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {groupedCourses[category].map((course, idx) => {
                          const uniqueId = course.id || idx.toString();
                          let finalPercentage: number | null = null;
                          if (course.mark !== undefined && course.mark !== null) {
                            finalPercentage = course.mark;
                          } else if (course.id) {
                            const calculated = calculateGrade(course.id);
                            if (calculated !== null) {
                              finalPercentage = parseFloat(calculated);
                            }
                          }
                          const letterGrade = finalPercentage !== null ? getYorkUGrade(finalPercentage).letter : "N/A";
                          
                          return (
                            <CourseCard
                              key={uniqueId}
                              course={course}
                              assignments={course.id ? assignments[course.id] || [] : []}
                              finalPercentage={finalPercentage}
                              letterGrade={letterGrade}
                              onClick={() => router.push(`/course/${uniqueId}`)}
                            />
                          );})}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
