"use client";

import { useState } from "react";

interface ChartTooltipShellProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  label?: any;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: (payload: any[], label: any) => React.ReactNode;
}

/**
 * Recharts hides its tooltip wrapper (visibility: hidden) the instant the cursor
 * leaves, which cuts off any exit animation rendered inside it. Charts using this
 * shell must pass wrapperStyle={{ visibility: 'visible' }} on the Tooltip so the
 * shell owns both the intro and outro transitions. The last payload is cached so
 * the outro still has content to fade out.
 */
export default function ChartTooltipShell({ active, payload, label, className = "", children }: ChartTooltipShellProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [last, setLast] = useState<{ payload: any[]; label: any } | null>(null);
  const isActive = !!(active && payload && payload.length);
  if (isActive && (last?.payload !== payload || last?.label !== label)) {
    setLast({ payload, label });
  }
  const data = isActive ? { payload, label } : last;

  return (
    <div
      className={`bg-surface border border-black/10 dark:border-white/10 p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] pointer-events-none min-w-[120px] transition-all duration-200 ease-out ${
        isActive ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1.5"
      } ${className}`}
    >
      {data ? children(data.payload, data.label) : null}
    </div>
  );
}
