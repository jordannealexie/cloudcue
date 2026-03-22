"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMediaQuery } from "../../hooks/useMediaQuery";

interface ActivityPoint {
  date: string;
  count: number;
}

interface ActivityChartProps {
  data: ActivityPoint[];
  loading?: boolean;
  error?: string | null;
}

export default function ActivityChart({ data, loading = false, error = null }: ActivityChartProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (loading) {
    return <div className="surface-card h-64 animate-pulse" />;
  }

  if (error) {
    return <div className="surface-card p-4 text-[var(--blush)]">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="surface-card p-4 text-[var(--text-secondary)]">No activity yet.</div>;
  }

  return (
    <div className="surface-card h-64 p-4">
      <h3 className="mb-3 text-[16px] font-semibold">Weekly Completion</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" hide={isMobile} stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <YAxis stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-modal)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)"
            }}
          />
          <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
