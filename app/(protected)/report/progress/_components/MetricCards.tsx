"use client";

import type { ProgressKpis } from "@/app/(protected)/report/progress/_logic/buildKpis";

function formatNumber(v: number) {
  return v.toFixed(2);
}

export default function MetricCards({ kpis }: { kpis: ProgressKpis }) {
  const varianceColor =
    kpis.varianceStatus === "ahead"
      ? "text-success"
      : kpis.varianceStatus === "behind"
        ? "text-danger"
        : "text-muted-foreground";

  const varianceLabel =
    kpis.varianceStatus === "ahead"
      ? "Ahead of Plan"
      : kpis.varianceStatus === "behind"
        ? "Behind Schedule"
        : "On Track";

  const cards = [
    {
      label: "Plan @ Cutoff",
      value: formatNumber(kpis.planAtCutoff),
      tone: "neutral",
    },
    {
      label: "Actual @ Cutoff",
      value: formatNumber(kpis.overallActual),
      tone: "accent",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-border bg-surface p-4 shadow-card"
        >
          <div className="text-xs text-muted-foreground">{c.label}</div>
          <div
            className={[
              "mt-2 text-2xl font-semibold",
              c.tone === "accent" ? "text-accent" : "text-foreground",
            ].join(" ")}
          >
            {c.value}
          </div>
        </div>
      ))}

      {/* Variance card (special) */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="text-xs text-muted-foreground">Variance @ Cutoff</div>

        <div className={`mt-2 text-2xl font-semibold ${varianceColor}`}>
          {formatNumber(kpis.varianceAtCutoff)}
        </div>

        <div className={`mt-1 text-xs ${varianceColor}`}>{varianceLabel}</div>
      </div>
    </div>
  );
}
