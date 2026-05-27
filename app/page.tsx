"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NeonButton from "./components/NeonButton";
import DashboardMetrics from "./components/DashboardMetrics";
import AddCourseForm from "./components/AddCourseForm";
import SyllabusImport from "./components/SyllabusImport";
import CourseCard from "./components/CourseCard";
import CourseFilters from "./components/CourseFilters";
import { Course, Assignment } from "./types";
import { useAuth } from "@/components/AuthProvider";
import { LogOut, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSyllabusImport, setShowSyllabusImport] = useState(false);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState<string[]>([]);
  const [filterYear, setFilterYear] = useState<string[]>([]);
  const [filterAcademicYear, setFilterAcademicYear] = useState<number[]>([]);
  const [filterCategory, setFilterCategory] = useState<string[]>([]);
  const [filterInProgress, setFilterInProgress] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
    } catch (error) {
      console.error("Error adding course", error);
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
    } catch (error) {
      console.error("Error importing syllabus", error);
    }
  };

  const calculateGrade = (courseId: string) => {
    const courseAssigns = assignments[courseId] || [];
    let totalWeight = 0;
    let earnedMark = 0;
    
    courseAssigns.forEach(a => {
        if (a.mark !== undefined && a.mark !== null && a.weight !== undefined && a.weight !== null) {
            totalWeight += a.weight;
            earnedMark += (a.mark * a.weight);
        }
    });

    if (totalWeight === 0) return null;
    return (earnedMark / totalWeight).toFixed(1);
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

  const availableSemesters = Array.from(new Set(courses.map(c => c.semester))).sort();
  const availableYears = Array.from(new Set(courses.map(c => c.year))).sort((a, b) => b - a);
  const availableAcademicYears = Array.from(new Set(courses.map(c => 
    c.semester === "Fall" ? c.year : c.year - 1
  ))).sort((a, b) => b - a);
  const availableCategories = Array.from(new Set(courses.map(c => c.category || "Uncategorized"))).filter(c => c !== "Uncategorized").sort();

  const calculateDashboardData = (dataToCalculate: Course[]) => {
    let totalCredits = 0;
    let earnedPoints = 0;
    const letterCounts: Record<string, number> = {
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

        const gradeInfo = getYorkUGrade(finalPercentage);
        if (gradeInfo.gpa !== null) {
          const credits = course.credits || 3;
          totalCredits += credits;
          earnedPoints += gradeInfo.gpa * credits;
          letterCounts[gradeInfo.letter] = (letterCounts[gradeInfo.letter] || 0) + 1;
        }
      }
    });

    const averageGpa = totalCredits > 0 ? (earnedPoints / totalCredits).toFixed(2) : "0.00";
    
    const pieData = Object.entries(letterCounts)
      .filter(([, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));

    const lineData = Object.entries(timelineDataMap)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([name, data]) => ({
        name,
        mark: parseFloat((data.totalMark / data.count).toFixed(2))
      }));

    return { averageGpa, pieData, lineData };
  };

  const { averageGpa, pieData, lineData } = calculateDashboardData(filteredCourses);
  const { signOut } = useAuth();

  if (authLoading || (loading && !userId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="h-16 w-16 rounded-full border-4 border-black/10 border-t-primary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 sm:pt-10">
      <header className="mb-12 flex flex-col sm:flex-row items-center justify-between border-b border-black/10 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-orbitron tracking-widest text-primary">
            GradeMatrix
          </h1>
          <p className="mt-2 text-muted text-sm uppercase tracking-wider">System Status: <span className="text-emerald-600 animate-pulse ml-1 font-semibold">Online</span></p>
        </div>
        
        <div className="flex items-center gap-4">
          <NeonButton onClick={() => setShowAddForm(true)}>
            Initialize New Course
          </NeonButton>
          <button
            onClick={() => setShowSyllabusImport(true)}
            className="group flex items-center gap-2 px-4 py-3 sm:py-2 rounded-xl bg-white shadow-sm border border-black/10 hover:border-primary hover:bg-white transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-primary transition-colors">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
            </svg>
            <div className="flex flex-col items-start translate-y-px">
              <span className="text-[9px] text-muted uppercase tracking-[0.2em] group-hover:text-primary transition-colors leading-none mb-1">AI Import</span>
              <span className="text-xs font-orbitron font-semibold text-secondary group-hover:text-primary transition-colors leading-none">Syllabus</span>
            </div>
          </button>
          
          <button 
            onClick={signOut}
            className="group flex items-center gap-2 px-4 py-3 sm:py-2 rounded-xl bg-white shadow-sm border border-black/10 hover:border-red-600 hover:bg-red-50 transition-all duration-300"
          >
            <div className="flex flex-col items-start translate-y-px">
               <span className="text-[9px] text-muted uppercase tracking-[0.2em] group-hover:text-red-600 transition-colors leading-none mb-1">Session</span>
               <span className="text-xs font-orbitron font-semibold text-secondary group-hover:text-red-600 transition-colors leading-none">Sign Out</span>
            </div>
            <LogOut className="w-4 h-4 text-muted group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </header>

      <main>
        {!loading && courses.length > 0 && (
          <>
            <DashboardMetrics averageGpa={averageGpa} pieData={pieData} lineData={lineData} />
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
          </>
        )}

        {showAddForm && (
          <AddCourseForm 
            onSubmit={handleAddCourse} 
            onCancel={() => setShowAddForm(false)} 
          />
        )}

        {showSyllabusImport && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSyllabusImport(false); }}
          >
            <SyllabusImport
              onImport={handleSyllabusImport}
              onCancel={() => setShowSyllabusImport(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-black/10 border-t-primary animate-spin"></div>
              <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-b-primary animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-32 text-muted flex flex-col items-center">
            <div className="w-24 h-24 mb-6 rounded-full border border-black/10 flex items-center justify-center bg-white shadow-sm relative">
               <div className="absolute inset-2 border border-dashed border-primary rounded-full animate-spin-slow"></div>
               <span className="text-3xl text-primary font-bold">Ø</span>
            </div>
            <p className="text-xl font-orbitron tracking-widest text-secondary font-bold">No databanks found.</p>
            <p className="mt-2 text-sm uppercase tracking-wider opacity-70">Initialize a new course to begin tracking.</p>
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
          <div className="flex flex-col gap-12">
            {(() => {
              const groupedCourses = filteredCourses.reduce((acc, course) => {
                const category = course.category && course.category.trim() !== "" ? course.category : "Uncategorized";
                if (!acc[category]) acc[category] = [];
                acc[category].push(course);
                return acc;
              }, {} as Record<string, Course[]>);

              return Object.keys(groupedCourses).sort().map(category => (
                <div key={category} className="flex flex-col gap-6">
                  <h2 className="text-2xl font-orbitron font-bold text-secondary border-b border-black/10 pb-2">{category}</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      </main>
    </div>
  );
}
