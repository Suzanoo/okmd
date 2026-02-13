"use client";

import type { ProgressPoint } from "@/app/report/_data/models/progress";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

type Props = {
  data: ProgressPoint[];
  cutoffLabel?: string | null;
};

function fmt(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
  if (typeof v === "string" && v.trim() !== "") return v;
  return "—";
}

export default function SCurveChart({ data, cutoffLabel }: Props) {
  const cutoffX = cutoffLabel
    ? (data.find((d) => d.week === cutoffLabel)?.week ?? null)
    : null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Plan vs Actual (S-Curve)
        </h2>
        <div className="text-xs text-muted-foreground">
          Cutoff: {cutoffLabel ?? "—"}
        </div>
      </div>

      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="week" hide />
            <YAxis tickFormatter={(v) => `${v}`} width={40} />

            <Tooltip
              formatter={(value, name) => [fmt(value), String(name ?? "")]}
              labelFormatter={(label) => String(label)}
            />

            <Legend />

            {cutoffX ? (
              <ReferenceLine
                x={cutoffX}
                stroke="var(--border)"
                strokeDasharray="6 6"
              />
            ) : null}

            <Line
              type="monotone"
              dataKey="plan"
              name="Plan"
              dot={false}
              strokeWidth={2}
              stroke="var(--color-accent-2)"
            />

            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              dot={false}
              strokeWidth={3}
              connectNulls={false}
              stroke="var(--color-accent)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
