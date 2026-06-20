import type { KpiResult } from "@/types/report";

function Card({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: string;
  tone?: "neutral" | "good" | "bad" | "blue" | "green";
}) {
  const color =
    tone === "blue"
      ? "text-accent"
      : tone === "green"
        ? "text-success"
        : tone === "good"
          ? "text-success"
          : tone === "bad"
            ? "text-danger"
            : "text-foreground";

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-card">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </div>
      <div className={`mt-4 text-4xl font-black ${color}`}>{value}</div>
    </div>
  );
}

export function KPICards({ kpi }: { kpi: KpiResult | null }) {
  const isGood = (kpi?.variance ?? 0) >= 0;

  return (
    <section className="grid gap-5 md:grid-cols-4">
      <Card
        title="Planned Progress"
        value={`${kpi?.plan.toFixed(2) ?? "0.00"}%`}
        tone="blue"
      />
      <Card
        title="Actual Progress"
        value={`${kpi?.actual.toFixed(2) ?? "0.00"}%`}
        tone="green"
      />
      <Card
        title="Schedule Status"
        value={`${kpi?.status ?? "Delay"} ${Math.abs(kpi?.variance ?? 0).toFixed(2)}%`}
        tone={isGood ? "good" : "bad"}
      />
      <Card
        title="Time Impact"
        value={`${kpi?.status ?? "Delay"} ${Math.abs(kpi?.days ?? 0)} Days`}
        tone={isGood ? "good" : "bad"}
      />
    </section>
  );
}
