"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export type RevenuePoint = {
  label: string;
  value: number;
};

export type DepartmentShare = {
  name: string;
  value: number;
  color?: string;
};

export type DashboardChartsProps = {
  lineData: RevenuePoint[];
  pieData: DepartmentShare[];
  lineColor?: string;
};

const fallbackColors = ["#60a5fa", "#34d399", "#f97316", "#a78bfa", "#facc15"];

export default function DashboardCharts({
  lineData,
  pieData,
  lineColor = "#3b82f6",
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="h-56 w-full rounded-xl border bg-background-1 p-4">
        {lineData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            暂无数据
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.3)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString()}`, "收入"]}
                labelFormatter={(label) => `日期: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="h-56 w-full rounded-xl border bg-background-1 p-4">
        {pieData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            暂无数据
          </div>
        ) : (
          <div className="flex h-full items-center gap-6">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={entry.color ?? fallbackColors[index % fallbackColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined, name: string | undefined) => [
                      `$${(value ?? 0).toLocaleString()}`,
                      name ?? "",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-sm">
              {pieData.map((entry, index) => (
                <div key={`${entry.name}-${index}`} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        entry.color ?? fallbackColors[index % fallbackColors.length],
                    }}
                  />
                  <span className="text-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
