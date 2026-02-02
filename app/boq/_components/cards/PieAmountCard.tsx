"use client";

import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";
import ChartCardShell from "./ChartCardShell";
import type { ChartDatum } from "@/lib/boq/boqTransform";
import { formatMoney } from "@/lib/boq/boqTransform";
import { useThemeStore } from "@/lib/theme/store";
import { getChartTheme } from "@/lib/theme/chartTheme";

const PALETTE = [
  "hsl(217 91% 60%)",
  "hsl(160 84% 39%)",
  "hsl(262 83% 58%)",
  "hsl(25 95% 53%)",
  "hsl(0 84% 60%)",
  "hsl(199 89% 48%)",
  "hsl(43 96% 56%)",
  "hsl(280 87% 65%)",
];

type Props = {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  selected?: string | null;
  onSelect: (name: string) => void;
  onClear?: () => void;
  height?: number;
};

export default function PieAmountCard({
  title,
  subtitle,
  data,
  selected,
  onSelect,
  onClear,
  height = 260,
}: Props) {
  const isDark = useThemeStore((s) => s.theme) === "dark";
  const t = getChartTheme(isDark);

  return (
    <ChartCardShell
      title={title}
      subtitle={subtitle}
      right={
        selected ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border px-3 py-1 text-xs transition"
            style={{
              borderColor: t.axisLine,
              background: t.isDark ? "rgba(2,6,23,0.10)" : "rgba(2,6,23,0.02)",
              color: t.tooltipText,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = t.isDark
                ? "rgba(2,6,23,0.20)"
                : "rgba(2,6,23,0.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = t.isDark
                ? "rgba(2,6,23,0.10)"
                : "rgba(2,6,23,0.02)";
            }}
          >
            Reset
          </button>
        ) : null
      }
    >
      {selected ? (
        <div className="mb-2 text-xs" style={{ color: t.tooltipMuted }}>
          Selected:{" "}
          <span className="font-medium" style={{ color: t.tooltipText }}>
            {selected}
          </span>
        </div>
      ) : null}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(v) => formatMoney(Number(v))}
              labelStyle={{ fontSize: 12, color: t.tooltipMuted }}
              itemStyle={{ color: t.tooltipText }}
              contentStyle={{
                backgroundColor: t.tooltipBg,
                border: `1px solid ${t.tooltipBorder}`,
                borderRadius: 12,
                color: t.tooltipText,
                boxShadow: t.isDark
                  ? "0 16px 36px rgba(0,0,0,0.55)"
                  : "0 14px 32px rgba(2,6,23,0.10)",
              }}
            />

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              stroke={t.sliceStroke}
              strokeWidth={t.sliceStrokeWidth}
              onClick={(d: unknown) => {
                const name = String((d as any)?.name ?? "");
                if (name) onSelect(name);
              }}
            >
              {data.map((d, i) => {
                const isDim = selected && d.name !== selected;
                return (
                  <Cell
                    key={`cell-${d.name}-${i}`}
                    fill={PALETTE[i % PALETTE.length]}
                    opacity={isDim ? 0.35 : 0.95}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-xs" style={{ color: t.tooltipMuted }}>
        Tip: คลิก slice เพื่อ filter WBS-1
      </div>
    </ChartCardShell>
  );
}
