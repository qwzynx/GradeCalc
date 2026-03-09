"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import NeonButton from "./components/NeonButton";
import GlassCard from "./components/GlassCard";

interface Assignment {
  id?: string;
  course_id: string;
  name: string;
  mark?: number;
  weight?: number;
}

interface Course {
  id?: string;
  user_id?: string;
  name: string;
  prof_name?: string;
  credits?: number;
  mark?: number;
  in_progress?: boolean;
  year: number;
  semester: string;
  category?: string;
}

export default function Home() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const TEST_USER_ID = "00b2d4c5-c95a-46ed-8c39-a7d154a8cb66";

  const fetchCourses = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/courses?user_id=${TEST_USER_ID}`);
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
    fetchCourses();
  }, []);

  const handleAddCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newCourse: Partial<Course> = {
      user_id: TEST_USER_ID,
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

  const PIE_COLORS: Record<string, string> = {
    'A+': '#34d399',
    'A': '#10b981',
    'B+': '#60a5fa',
    'B': '#3b82f6',
    'C+': '#fbbf24',
    'C': '#f59e0b',
    'D+': '#fb923c',
    'D': '#f97316',
    'F': '#ef4444'
  };

  const calculateDashboardData = () => {
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

    courses.forEach(course => {
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

  const { averageGpa, pieData, lineData } = calculateDashboardData();

  return (
    <div className="min-h-screen p-8 sm:p-20">
      <header className="mb-12 flex flex-col sm:flex-row items-center justify-between border-b border-prHighlight pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold font-orbitron tracking-widest text-transparent bg-clip-text bg-linear-to-r from-secondary to-alt-color drop-shadow-[0_0_10px_rgba(224,211,211,0.5)]">
            GradeMatrix
          </h1>
          <p className="mt-2 text-alt-color text-sm uppercase tracking-wider">System Status: <span className="text-secondary animate-pulse ml-1">Online</span></p>
        </div>
        <NeonButton onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Cancel Entry" : "Initialize New Course"}
        </NeonButton>
      </header>

      <main>
        {!loading && courses.length > 0 && (
          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <GlassCard className="flex flex-col items-center justify-center p-8 lg:col-span-1">
              <h2 className="text-sm uppercase tracking-widest text-alt-color mb-2 text-center">Cumulative GPA</h2>
              <div className="text-6xl font-orbitron font-bold text-secondary drop-shadow-[0_0_15px_rgba(224,211,211,0.6)]">
                {averageGpa}
              </div>
              <div className="text-xs mt-2 uppercase tracking-wider text-prHighlight">Out of 9.0 Scale</div>
            </GlassCard>
            <GlassCard className="p-6 lg:col-span-1 flex flex-col items-center justify-center min-h-[250px]">
               <h2 className="text-sm uppercase tracking-widest text-alt-color mb-4 w-full text-center">Grade Distribution</h2>
               {pieData.length > 0 ? (
                 <div className="w-60 h-48">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={pieData}
                         cx="50%"
                         cy="50%"
                         innerRadius={60}
                         outerRadius={80}
                         paddingAngle={5}
                         dataKey="value"
                         stroke="none"
                       >
                         {pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#ccc'} />
                         ))}
                       </Pie>
                       <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', borderColor: '#e0d3d3', borderRadius: '8px', color: '#e0d3d3' }}
                          itemStyle={{ color: '#e0d3d3' }}
                       />
                       <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }}/>
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
               ) : (
                 <div className="text-alt-color italic text-sm">No grade data available</div>
               )}
            </GlassCard>
            <GlassCard className="p-6 lg:col-span-2 flex flex-col items-center justify-center min-h-[250px]">
               <h2 className="text-sm uppercase tracking-widest text-alt-color mb-4 w-full text-center">Performance Timeline</h2>
               {lineData.length > 0 ? (
                 <div className="w-full h-48">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={lineData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#303642" vertical={false} />
                       <XAxis dataKey="name" stroke="#8a9ab3" fontSize={10} tickLine={false} axisLine={false} />
                       <YAxis stroke="#8a9ab3" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                       <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', borderColor: '#e0d3d3', borderRadius: '8px', color: '#e0d3d3' }}
                          formatter={(value: any) => [`${value}%`, 'Average Mark']}
                          labelStyle={{ color: '#e0d3d3', marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}
                       />
                       <Line type="monotone" dataKey="mark" stroke="#f2a65a" strokeWidth={3} dot={{ fill: '#f2a65a', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
               ) : (
                 <div className="text-alt-color italic text-sm">No timeline data available</div>
               )}
            </GlassCard>
          </div>
        )}

        {showAddForm && (
          <GlassCard className="mb-12 max-w-2xl mx-auto transform transition-all animate-in fade-in slide-in-from-top-4 relative z-10 w-full">
            <h2 className="text-2xl mb-6 font-orbitron text-secondary border-b border-prHighlight pb-2">Initialize New Course Parameters</h2>
            <form onSubmit={handleAddCourse} className="flex flex-col gap-6">
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
                  <label className="block text-xs uppercase tracking-wider text-alt-color mb-2">Category</label>
                  <input name="category" type="text" className="w-full bg-primary/50 border border-prHighlight rounded-md p-3 text-secondary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all" placeholder="e.g. Computer Science Science" />
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
        ) : (
          <div className="flex flex-col gap-12">
            {(() => {
              const groupedCourses = courses.reduce((acc, course) => {
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
                      return (
              <GlassCard 
                key={uniqueId} 
                className="group flex flex-col h-full hover:ring-2 hover:ring-secondary hover:scale-[1.02] cursor-pointer"
                onClick={() => router.push(`/course/${uniqueId}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-orbitron font-bold text-secondary group-hover:text-white transition-colors">{course.name}</h3>
                  <span className="text-xs uppercase tracking-wider bg-prHighlight/50 border border-prHighlight px-2 py-1 rounded text-secondary">{course.semester} {course.year}</span>
                </div>
                <div className="flex-1 space-y-3 text-sm text-alt-color mt-2">
                  <div className="flex justify-between items-center border-b border-prHighlight/30 pb-2">
                    <span className="uppercase text-[10px] tracking-widest">Instructor</span>
                    <span className="text-secondary">{course.prof_name || "Unassigned"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-prHighlight/30 pb-2">
                    <span className="uppercase text-[10px] tracking-widest">Status</span>
                    <span className={course.in_progress ? "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" : "text-alt-color"}>
                      {course.in_progress ? "Active" : "Archived"}
                    </span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-prHighlight/50 flex justify-between items-end">
                   <div className="uppercase text-[10px] tracking-widest text-alt-color">
                     {(course.mark !== undefined && course.mark !== null) ? (
                        <span className="text-red-400 flex items-center gap-1 drop-shadow-[0_0_5px_rgba(248,113,113,0.3)]">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                          Forced Grade Active
                        </span>
                     ) : "Calculated Grade"}
                   </div>
                   <div className="text-2xl font-orbitron">
                     {(() => {
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
                           const { letter } = getYorkUGrade(finalPercentage);
                           const colorClass = finalPercentage >= 80 ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" 
                                            : finalPercentage >= 70 ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]"
                                            : finalPercentage >= 60 ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                                            : finalPercentage >= 50 ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]"
                                            : "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]";
                           return <span className={`${colorClass} font-bold`}>{letter}</span>;
                        } else {
                           return <span className="text-alt-color italic text-lg">N/A</span>;
                        }
                     })()}
                   </div>
                </div>
              </GlassCard>
            )})}
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
