"use client";

import { useState } from 'react';
import { PieChart, Pie, Cell, Sector, Label, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import ChartTooltipShell from "./ChartTooltipShell";
import GlassCard from "./GlassCard";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const }
  })
};

const chartSwapVariants = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.25, ease: "easeIn" as const } }
};
import { useTheme } from "@/components/ThemeProvider";

interface DashboardMetricsProps {
  averageGpa: string;
  averageGpa4_0: string;
  pieData: { name: string, value: number }[];
  lineData: { name: string, mark: number }[];
  totalCourses: number;
  activeCourses: number;
  totalCredits: number;
}

const PIE_COLORS: Record<string, string> = {
  'A+': '#34d399',
  'A': '#10b981',
  'A-': '#059669',
  'B+': '#60a5fa',
  'B': '#3b82f6',
  'B-': '#2563eb',
  'C+': '#fbbf24',
  'C': '#f59e0b',
  'C-': '#d97706',
  'D+': '#fb923c',
  'D': '#f97316',
  'D-': '#ea580c',
  'F': '#ef4444'
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveSlice = (props: any) => (
  <Sector
    {...props}
    outerRadius={props.outerRadius + 6}
    style={{ filter: `drop-shadow(0 0 6px ${props.fill}80)`, transition: 'all 0.2s ease-out' }}
  />
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomPieTooltip = ({ active, payload, total }: any) => (
  <ChartTooltipShell active={active} payload={payload}>
    {(p) => (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[p[0].name] || '#ccc' }} />
          <span className="text-sm uppercase tracking-wider text-muted font-orbitron font-bold">
            {p[0].name}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-primary font-orbitron tabular-nums">
            {p[0].value} Course{p[0].value > 1 ? 's' : ''}
          </span>
          {total > 0 && (
            <span className="text-[10px] font-bold text-muted tabular-nums">
              · {((p[0].value / total) * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    )}
  </ChartTooltipShell>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLineTooltip = ({ active, payload, label, data }: any) => (
  <ChartTooltipShell active={active} payload={payload} label={label} className="min-w-[140px]">
    {(p, lbl) => {
      let delta: number | null = null;
      if (Array.isArray(data)) {
        const idx = data.findIndex((d: { name: string }) => d.name === lbl);
        if (idx > 0) delta = p[0].value - data[idx - 1].mark;
      }
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm uppercase tracking-wider text-muted font-orbitron font-bold">
            {lbl}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-primary font-orbitron tabular-nums">
              {p[0].value.toFixed(2)}% Average
            </span>
          </div>
          {delta !== null && (
            <span className={`text-[10px] font-bold tabular-nums tracking-wide ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}% vs previous term
            </span>
          )}
        </div>
      );
    }}
  </ChartTooltipShell>
);

export default function DashboardMetrics({ averageGpa, averageGpa4_0, pieData, lineData, totalCourses, activeCourses, totalCredits }: DashboardMetricsProps) {
  const [is4Scale, setIs4Scale] = useState(false);
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#A0A0A0' : '#5D6170';
  const strongTextColor = theme === 'dark' ? '#FFFFFF' : '#1D1E26';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb';
  const dotFill = theme === 'dark' ? '#1E1E1E' : '#FFFFFF';

  const gradedTotal = pieData.reduce((sum, d) => sum + d.value, 0);
  const timelineAvg = lineData.length > 0 ? lineData.reduce((sum, d) => sum + d.mark, 0) / lineData.length : 0;

  return (
    <div className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0} className="lg:col-span-1">
      <GlassCard
        className="flex flex-col items-center justify-center p-6 sm:p-8 h-full cursor-pointer hover:border-primary transition-colors group"
        onClick={() => setIs4Scale(!is4Scale)}
      >
        <h2 className="text-xs sm:text-sm uppercase tracking-widest text-primary mb-2 text-center group-hover:scale-105 transition-transform">Cumulative GPA</h2>
        <div className="text-5xl sm:text-6xl font-orbitron font-bold text-secondary">
          {is4Scale ? averageGpa4_0 : averageGpa}
        </div>
        <div className="text-[10px] sm:text-xs mt-2 uppercase tracking-wider text-muted flex items-center gap-1">
          <span>{is4Scale ? "Out of 4.0 Scale" : "Out of 9.0 Scale"}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100 transition-opacity"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        </div>
        <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10 w-full grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-orbitron font-bold text-secondary tabular-nums">{totalCourses}</span>
            <span className="text-[9px] uppercase tracking-widest text-muted">Courses</span>
          </div>
          <div className="flex flex-col border-x border-black/10 dark:border-white/10">
            <span className="text-lg sm:text-xl font-orbitron font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{activeCourses}</span>
            <span className="text-[9px] uppercase tracking-widest text-muted">Active</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-orbitron font-bold text-secondary tabular-nums">{totalCredits}</span>
            <span className="text-[9px] uppercase tracking-widest text-muted">Credits</span>
          </div>
        </div>
      </GlassCard>
      </motion.div>
      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1} className="lg:col-span-1">
      <GlassCard className="p-5 sm:p-6 h-full flex flex-col items-center justify-center min-h-[250px]">
          <h2 className="text-xs sm:text-sm uppercase tracking-widest text-primary mb-4 w-full text-center">Grade Distribution</h2>
          <AnimatePresence mode="wait" initial={false}>
          {pieData.length > 0 ? (
            <motion.div key={`pie-${theme}`} variants={chartSwapVariants} initial="initial" animate="animate" exit="exit" className="w-full h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    cornerRadius={4}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                    activeShape={renderActiveSlice}
                    inactiveShape={{ opacity: 0.45 }}
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#ccc'} />
                    ))}
                    <Label
                      position="center"
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      content={(props: any) => {
                        const { cx, cy } = props.viewBox || {};
                        if (cx === undefined || cy === undefined) return null;
                        return (
                          <g pointerEvents="none">
                            <text x={cx} y={cy - 4} textAnchor="middle" fill={strongTextColor} fontSize={22} fontWeight={700} className="font-orbitron tabular-nums">
                              {gradedTotal}
                            </text>
                            <text x={cx} y={cy + 14} textAnchor="middle" fill={textColor} fontSize={8} letterSpacing="0.2em" className="uppercase">
                              GRADED
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Pie>
                  <RechartsTooltip
                    content={<CustomPieTooltip total={gradedTotal} />}
                    animationDuration={300}
                    wrapperStyle={{ visibility: 'visible' }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={9} wrapperStyle={{ fontSize: '11px', color: textColor, paddingTop: '10px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div key="pie-empty" variants={chartSwapVariants} initial="initial" animate="animate" exit="exit" className="text-muted italic text-sm">
              No grade data available
            </motion.div>
          )}
          </AnimatePresence>
      </GlassCard>
      </motion.div>
      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2} className="lg:col-span-2">
      <GlassCard className="p-0 h-full flex flex-col min-h-[280px] overflow-hidden relative group">
          <div className="p-6 pb-0 pointer-events-none z-10 flex items-baseline justify-between">
            <h2 className="text-xs sm:text-sm uppercase tracking-widest text-primary opacity-70">Performance Timeline</h2>
            {lineData.length > 1 && (
              <span className="text-[9px] uppercase tracking-widest text-muted tabular-nums">
                Overall Avg <span className="text-secondary font-bold">{timelineAvg.toFixed(1)}%</span>
              </span>
            )}
          </div>
          <AnimatePresence mode="wait" initial={false}>
          {lineData.length > 0 ? (
            <motion.div key={`line-${theme}`} variants={chartSwapVariants} initial="initial" animate="animate" exit="exit" className="w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lineData} margin={{ top: 30, right: 30, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E31D2B" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#E31D2B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} opacity={0.5} />
                  <XAxis dataKey="name" stroke={textColor} fontSize={9} tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                  <YAxis stroke={textColor} fontSize={9} tickLine={false} axisLine={false} width={34} tickMargin={4} domain={['auto', 'auto']} tickFormatter={(v: number) => `${v}%`} />
                  {lineData.length > 1 && (
                    <ReferenceLine
                      y={timelineAvg}
                      stroke={textColor}
                      strokeDasharray="4 4"
                      strokeOpacity={0.5}
                    />
                  )}
                  <RechartsTooltip
                    content={<CustomLineTooltip data={lineData} />}
                    animationDuration={300}
                    wrapperStyle={{ visibility: 'visible' }}
                    cursor={{ stroke: '#E31D2B', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mark"
                    stroke="#E31D2B"
                    strokeWidth={3}
                    fill="url(#timelineGradient)"
                    dot={{ fill: dotFill, stroke: '#E31D2B', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#E31D2B', stroke: dotFill, strokeWidth: 2 }}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div key="line-empty" variants={chartSwapVariants} initial="initial" animate="animate" exit="exit" className="flex-1 flex items-center justify-center text-muted italic text-sm">
              No timeline data available
            </motion.div>
          )}
          </AnimatePresence>
      </GlassCard>
      </motion.div>
    </div>
  );
}
