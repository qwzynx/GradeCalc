"use client";

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import GlassCard from "./GlassCard";
import { useTheme } from "@/components/ThemeProvider";

interface DashboardMetricsProps {
  averageGpa: string;
  averageGpa4_0: string;
  pieData: { name: string, value: number }[];
  lineData: { name: string, mark: number }[];
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

export default function DashboardMetrics({ averageGpa, averageGpa4_0, pieData, lineData }: DashboardMetricsProps) {
  const [is4Scale, setIs4Scale] = useState(false);
  const { theme } = useTheme();

  const textColor = theme === 'dark' ? '#A0A0A0' : '#333333';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb';
  const tooltipBg = theme === 'dark' ? '#1E1E1E' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb';
  const tooltipText = theme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <div className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
      <GlassCard 
        className="flex flex-col items-center justify-center p-6 sm:p-8 lg:col-span-1 cursor-pointer hover:border-primary transition-colors group"
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
      </GlassCard>
      <GlassCard className="p-5 sm:p-6 lg:col-span-1 flex flex-col items-center justify-center min-h-[250px]">
          <h2 className="text-xs sm:text-sm uppercase tracking-widest text-primary mb-4 w-full text-center">Grade Distribution</h2>
          {pieData.length > 0 ? (
            <div className="w-full h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%" key={theme}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#ccc'} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: tooltipText, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: tooltipText }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', color: textColor, paddingTop: '10px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-muted italic text-sm">No grade data available</div>
          )}
      </GlassCard>
      <GlassCard className="p-5 sm:p-6 lg:col-span-2 flex flex-col items-center justify-center min-h-[250px]">
          <h2 className="text-xs sm:text-sm uppercase tracking-widest text-primary mb-4 w-full text-center">Performance Timeline</h2>
          {lineData.length > 0 ? (
            <div className="w-full h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%" key={theme}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: tooltipText, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: any) => [`${value}%`, 'Average Mark']}
                    labelStyle={{ color: tooltipText, marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}
                  />
                  <Line type="monotone" dataKey="mark" stroke="#E31D2B" strokeWidth={2.5} dot={{ fill: '#E31D2B', strokeWidth: 1.5, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-muted italic text-sm">No timeline data available</div>
          )}
      </GlassCard>
    </div>
  );
}
