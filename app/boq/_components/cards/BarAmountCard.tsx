// app/boq/_components/cards/BarAmountCard.tsx
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

  return (
    <ChartCardShell title={title} subtitle={subtitle} right={topControl}>
      {disabled ? (
        <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          {disabledHint}
        </div>
      ) : (
        <>
          {selected ? (
            <div className="mb-2 text-xs text-muted-foreground">
              Selected:{" "}
              <span className="font-medium text-foreground">{selected}</span>
            </div>
          ) : null}

          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 6, right: 8, bottom: 6, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  scale="log"
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatMoney(Number(v))}
                  width={70}
                />
                <Tooltip
                  formatter={(v) => formatMoney(Number(v))}
                  labelStyle={{ fontSize: 12 }}
                />

                <Bar
                  dataKey="value"
                  opacity={0.9}
                  fill={usePalette ? undefined : color}
                  onClick={(d: any) => onSelect?.(String(d?.name ?? ""))}
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

          <div className="mt-2 text-xs text-muted-foreground">
            Tip: คลิก bar เพื่อ cascade (optional)
          </div>
        </>
      )}
    </ChartCardShell>
  );
}
