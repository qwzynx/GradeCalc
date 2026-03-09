"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NeonButton from "./components/NeonButton";
import DashboardMetrics from "./components/DashboardMetrics";
import AddCourseForm from "./components/AddCourseForm";
import CourseCard from "./components/CourseCard";
import CourseFilters from "./components/CourseFilters";
import { Course, Assignment } from "./types";
import { useAuth } from "@/components/AuthProvider";
import { LogOut, User as UserIcon } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  
  const userId = user?.id;

  const fetchCourses = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/courses?user_id=${userId}`);
      const data = await res.json();
      setCourses(data || []);

      const assignData: Record<string, Assignment[]> = {};
      if (data && data.length > 0) {
        await Promise.all(data.map(async (course: Course) => {
          if (course.id) {
            try {
              const aRes = await fetch(`http://localhost:8000/api/courses/${course.id}/assignments`);
              const aData = await aRes.json();
              assignData[course.id] = aData || [];
            } catch (err) {
              console.error(`Failed fetching assignments for course ${course.id}`, err);
            }
          }
        }));
      }
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
      await fetch("http://localhost:8000/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCourse),
      });
      setShowAddForm(false);
      fetchCourses();
    } catch (error) {
      console.error("Error adding course", error);
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
    
    const matchesSemester = filterSemester === "All" || course.semester === filterSemester;
    const matchesYear = filterYear === "All" || course.year.toString() === filterYear;
    const matchesCategory = filterCategory === "All" || course.category === filterCategory;

    return matchesSearch && matchesSemester && matchesYear && matchesCategory;
  });

  const availableSemesters = Array.from(new Set(courses.map(c => c.semester))).sort();
  const availableYears = Array.from(new Set(courses.map(c => c.year))).sort((a, b) => b - a);
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
      <div className="min-h-screen flex items-center justify-center bg-primary">
         <div className="h-16 w-16 rounded-full border-4 border-prHighlight border-t-secondary animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 sm:pt-10">
      <header className="mb-12 flex flex-col sm:flex-row items-center justify-between border-b border-prHighlight pb-6 gap-4">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold font-orbitron tracking-widest text-transparent bg-clip-text bg-linear-to-r from-secondary to-alt-color drop-shadow-[0_0_10px_rgba(224,211,211,0.5)]">
              GradeMatrix
            </h1>
            <p className="mt-2 text-alt-color text-sm uppercase tracking-wider">System Status: <span className="text-secondary animate-pulse ml-1">Online</span></p>
          </div>
          <button 
            onClick={signOut}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300"
          >
            <div className="flex flex-col items-start">
               <span className="text-[10px] text-alt-color/40 uppercase tracking-[0.2em] group-hover:text-red-400/60 transition-colors">Session</span>
               <span className="text-xs font-orbitron text-alt-color group-hover:text-red-400 transition-colors">Sign Out</span>
            </div>
            <LogOut className="w-4 h-4 text-alt-color group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
        <NeonButton onClick={() => setShowAddForm(true)}>
          Initialize New Course
        </NeonButton>
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
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              availableSemesters={availableSemesters}
              availableYears={availableYears}
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

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-prHighlight border-t-secondary animate-spin"></div>
              <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-b-secondary animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-32 text-alt-color flex flex-col items-center">
            <div className="w-24 h-24 mb-6 rounded-full border border-prHighlight flex items-center justify-center bg-primary/30 relative">
               <div className="absolute inset-2 border border-dashed border-alt-color rounded-full animate-spin-slow"></div>
               <span className="text-3xl">Ø</span>
            </div>
            <p className="text-xl font-orbitron tracking-widest text-secondary">No databanks found.</p>
            <p className="mt-2 text-sm uppercase tracking-wider opacity-70">Initialize a new course to begin tracking.</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
             <div className="w-16 h-16 mb-4 rounded-full border border-prHighlight/30 flex items-center justify-center bg-primary/20">
               <span className="text-xl opacity-50 text-alt-color font-orbitron">!</span>
            </div>
            <p className="text-lg font-orbitron tracking-widest text-alt-color">No results found for current filters.</p>
            <button 
              onClick={() => {
                setSearchTerm("");
                setFilterSemester("All");
                setFilterYear("All");
                setFilterCategory("All");
              }}
              className="mt-4 text-secondary hover:underline cursor-pointer font-orbitron text-xs uppercase tracking-widest"
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
                  <h2 className="text-2xl font-orbitron text-secondary border-b border-prHighlight/50 pb-2">{category}</h2>
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
