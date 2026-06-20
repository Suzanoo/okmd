"use client";

import { useEffect, useMemo, useState } from "react";
import { KPICards } from "./_components/KPICards";
import { ProgressTable } from "./_components/ProgressTable";
import { ReportControls } from "./_components/ReportControls";
import { SCurveChart } from "./_components/SCurveChart";
import {
  buildChartRows,
  getBaseRows,
  getCutoffOptions,
} from "@/lib/report/aggregateProgress";
import { calculateKpi } from "@/lib/report/calculateKpi";
import { parseProgressCsv } from "@/lib/report/parseProgressCsv";
import type { ProgressRow, ViewMode } from "@/types/report";

export default function ReportPage() {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [mode, setMode] = useState<ViewMode>("weekly");
  const [cutoffDate, setCutoffDate] = useState("");

  useEffect(() => {
    fetch("/data/progress.csv")
      .then((res) => res.text())
      .then((text) => {
        const parsed = parseProgressCsv(text);
        setRows(parsed);
        setCutoffDate(parsed.at(-1)?.week_start ?? "");
      })
      .catch((error) => {
        console.error("Failed to load progress.csv", error);
      });
  }, []);

  const handleModeChange = (nextMode: ViewMode) => {
    setMode(nextMode);

    const nextRows = getBaseRows(rows, nextMode);
    setCutoffDate(nextRows.at(-1)?.week_start ?? "");
  };

  const options = useMemo(() => getCutoffOptions(rows, mode), [rows, mode]);

  const baseRows = useMemo(() => getBaseRows(rows, mode), [rows, mode]);

  const chartRows = useMemo(
    () => buildChartRows(rows, mode, cutoffDate),
    [rows, mode, cutoffDate],
  );

  const kpi = useMemo(
    () => calculateKpi(baseRows, cutoffDate),
    [baseRows, cutoffDate],
  );

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
              OKMD Construction Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              Project Performance Report
            </h1>
          </div>

          <ReportControls
            mode={mode}
            setMode={handleModeChange}
            cutoffDate={cutoffDate}
            setCutoffDate={setCutoffDate}
            options={options}
          />
        </div>

        <KPICards kpi={kpi} />

        <SCurveChart data={chartRows} />

        <ProgressTable data={chartRows} />
      </div>
    </main>
  );
}
