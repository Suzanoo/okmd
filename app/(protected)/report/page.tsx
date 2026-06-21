"use client";

import { useEffect, useMemo, useState } from "react";

import type { ActivityRow, ProgressRow, ViewMode } from "@/types/report";

import { KPICards } from "./_components/KPICards";
// import { ProgressTable } from "./_components/ProgressTable";
import { ReportControls } from "./_components/ReportControls";
import { SCurveChart } from "./_components/SCurveChart";
import {
  buildChartRows,
  // buildTableRows,
  getBaseRows,
  getCutoffOptions,
} from "@/lib/report/aggregateProgress";

import { calculateKpi } from "@/lib/report/calculateKpi";
import { parseProgressCsv } from "@/lib/report/parseProgressCsv";

import { ActivityTable } from "./_components/ActivityTable";
import { calculateActivityProgress } from "@/lib/report/calculateActivityProgress";
import { parseActivityCsv } from "@/lib/report/parseActivityCsv";

export default function ReportPage() {
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [mode, setMode] = useState<ViewMode>("weekly");
  const [cutoffDate, setCutoffDate] = useState("");

  const options = useMemo(() => getCutoffOptions(rows, mode), [rows, mode]);

  const baseRows = useMemo(() => getBaseRows(rows, mode), [rows, mode]);

  const cutoffRow = useMemo(
    () => baseRows.find((row) => row.week_start === cutoffDate) ?? null,
    [baseRows, cutoffDate],
  );

  const chartRows = useMemo(
    () => buildChartRows(rows, mode, cutoffDate),
    [rows, mode, cutoffDate],
  );

  // const tableRows = useMemo(
  //   () => buildTableRows(rows, mode, cutoffDate),
  //   [rows, mode, cutoffDate],
  // );

  // useEffect(() => {
  //   console.log("mode =", mode);
  //   console.log("cutoff =", cutoffDate);
  // }, [mode, cutoffDate]);

  // useEffect(() => {
  //   console.log("cutoffRow =", cutoffRow);
  // }, [cutoffRow]);

  const [activityRows, setActivityRows] = useState<ActivityRow[]>([]);

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

  useEffect(() => {
    fetch("/data/progress_table.csv")
      .then((res) => res.text())
      .then((text) => {
        setActivityRows(parseActivityCsv(text));
      })
      .catch((error) => {
        console.error("Failed to load progress_table.csv", error);
      });
  }, []);

  const handleModeChange = (nextMode: ViewMode) => {
    setMode(nextMode);

    const nextRows = getBaseRows(rows, nextMode);
    setCutoffDate(nextRows.at(-1)?.week_start ?? "");
  };

  const kpi = useMemo(() => calculateKpi(cutoffRow), [cutoffRow]);

  const activityTableRows = useMemo(
    () => calculateActivityProgress(activityRows, cutoffDate),
    [activityRows, cutoffDate],
  );

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
              OKD Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              QUE SERA, SERA. 🙈 🙉 🙊
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
        <ActivityTable data={activityTableRows} />

        {/* <ProgressTable data={tableRows} /> */}
      </div>
    </main>
  );
}
