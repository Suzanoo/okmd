"use client";

import { ReactNode } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import ChartCardShell from "./ChartCardShell";
import type { ChartDatum } from "@/lib/boq/boqTransform";
import { formatMoney } from "@/lib/boq/boqTransform";
import { useThemeStore } from "@/lib/theme/store";
import { getChartTheme } from "@/lib/theme/chartTheme";

type Props = {
  title: string;
  subtitle?: string;

  // chart
  data: ChartDatum[];
  /** fallback single color (used only if palette is not provided) */
  color?: string;
  /** if provided -> multi-color bars */
  palette?: string[];

  // interaction
  selected?: string | null;
  onSelect?: (name: string) => void;

  // ui
  topControl?: ReactNode;
  disabled?: boolean;
  disabledHint?: string;
  height?: number;
};

const DEFAULT_PALETTE = [
  "hsl(217 91% 60%)", // blue
  "hsl(199 89% 48%)", // cyan
  "hsl(160 84% 39%)", // teal/green
  "hsl(262 83% 58%)", // purple
  "hsl(43 96% 56%)", // amber
  "hsl(25 95% 53%)", // orange
  "hsl(0 84% 60%)", // red (soft)
  "hsl(280 87% 65%)", // pink/purple
];

const EPS = 1e3;

export default function BarAmountCard({
  title,
  subtitle,
  data,
  color = "hsl(217 91% 60%)",
  palette = DEFAULT_PALETTE,
  selected,
  onSelect,
  topControl,
  disabled,
  disabledHint = "Select upstream filter to render chart.",
  height = 240,
}: Props) {
  const usePalette = Array.isArray(palette) && palette.length > 0;

  const isDark = useThemeStore((s) => s.theme) === "dark";
  const t = getChartTheme(isDark);

  return (
    <ChartCardShell title={title} subtitle={subtitle} right={topControl}>
      {disabled ? (
        <div
          className="rounded-xl border border-dashed p-6 text-sm"
          style={{
            borderColor: t.hintBorder,
            color: t.hintText,
            background: t.hintBg,
          }}
        >
          {disabledHint}
        </div>
      ) : (
        <>
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
              <BarChart
                data={data}
                margin={{ top: 6, right: 8, bottom: 6, left: 8 }}
              >
                <CartesianGrid stroke={t.gridStroke} strokeDasharray="3 3" />

                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: t.axisTick }}
                  axisLine={{ stroke: t.axisLine }}
                  tickLine={{ stroke: t.axisLine }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={50}
                />

                <YAxis
                  scale="log"
                  domain={[EPS, "dataMax"]}
                  allowDataOverflow
                  tick={{ fontSize: 11, fill: t.axisTick }}
                  axisLine={{ stroke: t.axisLine }}
                  tickLine={{ stroke: t.axisLine }}
                  tickFormatter={(v) => formatMoney(Number(v))}
                  width={70}
                />

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

                <Bar
                  dataKey="value"
                  minPointSize={2}
                  opacity={0.92}
                  fill={usePalette ? undefined : color}
                  onClick={(d: unknown) => {
                    const name = String((d as any)?.name ?? "");
                    if (name) onSelect?.(name);
                  }}
                >
                  {usePalette
                    ? data.map((d, i) => (
                        <Cell
                          key={`cell-${d.name}-${i}`}
                          fill={palette[i % palette.length]}
                          opacity={
                            selected && d.name !== selected ? 0.35 : 0.95
                          }
                        />
                      ))
                    : null}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-xs" style={{ color: t.tooltipMuted }}>
            Tip: คลิก bar เพื่อ cascade (optional)
          </div>
        </>
      )}
    </ChartCardShell>
  );
}
