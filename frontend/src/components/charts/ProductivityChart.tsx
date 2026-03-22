"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMediaQuery } from "../../hooks/useMediaQuery";

interface ProductivityPoint {
  date: string;
  count: number;
}

interface ProductivityChartProps {
  data: ProductivityPoint[];
  loading?: boolean;
  error?: string | null;
}

export default function ProductivityChart({ data, loading = false, error = null }: ProductivityChartProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (loading) {
    return <div className="surface-card h-64 animate-pulse" />;
  }

  if (error) {
    return <div className="surface-card p-4 text-[var(--blush)]">{error}</div>;
  }

  if (data.length === 0) {
    return <div className="surface-card p-4 text-[var(--text-secondary)]">No productivity data yet.</div>;
  }

  return (
    <div className="surface-card h-64 p-4">
      <h3 className="mb-3 text-[16px] font-semibold">Productivity Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" hide={isMobile} stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <YAxis stroke="var(--text-secondary)" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-modal)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)"
            }}
          />
          <Line type="monotone" dataKey="count" stroke="var(--blush)" strokeWidth={3} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
