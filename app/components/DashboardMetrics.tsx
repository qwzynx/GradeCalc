"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import GlassCard from "./GlassCard";

interface DashboardMetricsProps {
  averageGpa: string;
  pieData: { name: string, value: number }[];
  lineData: { name: string, mark: number }[];
}

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

export default function DashboardMetrics({ averageGpa, pieData, lineData }: DashboardMetricsProps) {
  return (
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
  );
}
