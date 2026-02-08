"use client";

import { useMemo } from "react";
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

const DEFAULT_TOP_N = 7;

type Props = {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  selected?: string | null;
  onSelect: (name: string) => void;
  onClear?: () => void;
  height?: number;

  /** Reduce clutter by showing Top N + Others (default 7) */
  topN?: number;
};

export default function PieAmountCard({
  title,
  subtitle,
  data,
  selected,
  onSelect,
  onClear,
  height = 260,
  topN = DEFAULT_TOP_N,
}: Props) {
  const isDark = useThemeStore((s) => s.theme) === "dark";
  const t = getChartTheme(isDark);

  const total = useMemo(
    () => data.reduce((acc, d) => acc + (d.value ?? 0), 0),
    [data],
  );

  const grouped = useMemo((): ChartDatum[] => {
    if (!data.length) return [];

    const sorted = [...data].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    // take topN first
    let top = sorted.slice(0, Math.max(1, topN));
    let rest = sorted.slice(Math.max(1, topN));

    // UX: if user selected something outside top, pull it up so it doesn't disappear
    if (selected) {
      const inTop = top.some((x) => x.name === selected);
      if (!inTop) {
        const selIdx = rest.findIndex((x) => x.name === selected);
        if (selIdx >= 0) {
          const sel = rest[selIdx];
          rest = rest.filter((_, i) => i !== selIdx);

          // push last of top into rest to keep size stable
          if (top.length > 0) {
            const kicked = top[top.length - 1];
            top = top.slice(0, top.length - 1);
            rest = [kicked, ...rest];
          }
          top = [...top, sel];
        }
      }
    }

    const othersValue = rest.reduce((acc, d) => acc + (d.value ?? 0), 0);
    const out: ChartDatum[] = [...top];

    if (othersValue > 0) {
      out.push({ name: "Others", value: othersValue });
    }

    return out;
  }, [data, topN, selected]);

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
      {/* Total legend + optional selected */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div style={{ color: t.tooltipMuted }}>
          Total Amount:{" "}
          <span className="font-semibold" style={{ color: t.tooltipText }}>
            {formatMoney(total)}
          </span>
        </div>

        {selected ? (
          <div style={{ color: t.tooltipMuted }}>
            Selected:{" "}
            <span className="font-medium" style={{ color: t.tooltipText }}>
              {selected}
            </span>
          </div>
        ) : null}
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(v, name, props) => {
                const value = Number(v) || 0;
                const pct = total > 0 ? (value / total) * 100 : 0;

                // สวย ๆ: เงิน + เปอร์เซ็นต์ (ทศนิยม 1 ตำแหน่ง)
                const pctText =
                  pct >= 0.1 ? `${pct.toFixed(1)}%` : pct > 0 ? "<0.1%" : "0%";

                // Return value text + label (Recharts ใช้ [value, name])
                return [`${formatMoney(value)}  •  ${pctText}`, String(name)];
              }}
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
              data={grouped}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              stroke={t.sliceStroke}
              strokeWidth={t.sliceStrokeWidth}
              onClick={(d: unknown) => {
                const name = String((d as any)?.name ?? "");
                if (!name || name === "Others") return; // Others is not a real WBS
                onSelect(name);
              }}
            >
              {grouped.map((d, i) => {
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

      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
        <div style={{ color: t.tooltipMuted }}>
          Tip: คลิก slice เพื่อ filter WBS-1
        </div>
        <div style={{ color: t.tooltipMuted }}>
          Showing Top {topN}
          {grouped.some((x) => x.name === "Others") ? " + Others" : ""}
        </div>
      </div>
    </ChartCardShell>
  );
}
