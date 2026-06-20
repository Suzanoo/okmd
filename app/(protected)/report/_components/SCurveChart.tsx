"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartRow } from "@/types/report";

export function SCurveChart({ data }: { data: ChartRow[] }) {
  return (
    <section className="mt-6 rounded-3xl border border-border bg-surface p-6 shadow-card-lg">
      <div className="mb-5">
        <h2 className="text-xl font-bold">S-Curve</h2>
        <p className="text-sm text-muted-foreground">Plan vs Actual Progress</p>
      </div>

      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.25)"
            />
            <XAxis dataKey="label" stroke="rgb(100,116,139)" />
            <YAxis stroke="rgb(100,116,139)" domain={[0, 100]} />
            <Tooltip />
            <Legend />

            <Line
              type="monotone"
              dataKey="plan"
              name="Plan"
              stroke="#2563eb"
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6 }}
            />

            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#16a34a"
              strokeWidth={4}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
