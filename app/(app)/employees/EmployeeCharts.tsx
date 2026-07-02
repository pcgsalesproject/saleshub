"use client";

import {
  PieChart, Pie, Cell, Label,
  BarChart, Bar, XAxis, YAxis, LabelList,
  ResponsiveContainer,
} from "recharts";
import s from "./EmployeeStats.module.css";

const DEPT_COLORS = [
  "#a855f7", "#3b82f6", "#22c55e", "#06b6d4", "#f97316",
  "#ef4444", "#facc15", "#8b5cf6", "#10b981", "#f59e0b",
  "#6366f1", "#ec4899", "#14b8a6", "#84cc16", "#9ca3af",
];

export function DepartmentDonut({ data }: { data: { name: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={1}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
            ))}
            <Label
              content={({ viewBox }) => {
                const { cx, cy } = viewBox as { cx: number; cy: number };
                return (
                  <text x={cx} y={cy} textAnchor="middle">
                    <tspan x={cx} dy="-0.2em" fontSize="22" fontWeight="700" fill="#111827">
                      {total}
                    </tspan>
                    <tspan x={cx} dy="1.5em" fontSize="12" fill="#9ca3af">
                      คน
                    </tspan>
                  </text>
                );
              }}
              position="center"
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className={s.legendGrid}>
        {data.map((d, i) => (
          <div key={d.name} className={s.legendItem}>
            <span className={s.legendDot} style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
            <span>
              {d.name} {((d.count / total) * 100).toFixed(0)}% ({d.count} คน)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgeBarChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: -28 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={44}>
          <LabelList
            dataKey="count"
            position="top"
            style={{ fontSize: 11, fontWeight: 600, fill: "#374151" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TenureHBarChart({ data }: { data: { label: string; count: number; pct: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          width={88}
        />
        <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} maxBarSize={18}>
          <LabelList
            dataKey="count"
            position="right"
            style={{ fontSize: 11, fontWeight: 600, fill: "#374151" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
