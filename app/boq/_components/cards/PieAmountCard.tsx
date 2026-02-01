"use client";

import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from "recharts";
import ChartCardShell from "./ChartCardShell";
import type { ChartDatum } from "@/lib/boq/boqTransform";
import { formatMoney } from "@/lib/boq/boqTransform";

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
  return (
    <ChartCardShell
      title={title}
      subtitle={subtitle}
      right={
        selected ? (
          <button
            onClick={onClear}
            className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
            type="button"
          >
            Reset
          </button>
        ) : null
      }
    >
      {selected ? (
        <div className="mb-2 text-xs text-muted-foreground">
          Selected:{" "}
          <span className="font-medium text-foreground">{selected}</span>
        </div>
      ) : null}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(v) => formatMoney(Number(v))}
              labelStyle={{ fontSize: 12 }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              onClick={(d: any) => onSelect(String(d?.name ?? ""))}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Tip: คลิก slice เพื่อ filter WBS-1
      </div>
    </ChartCardShell>
  );
}
