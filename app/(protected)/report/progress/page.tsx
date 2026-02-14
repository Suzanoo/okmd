"use client";

/**
 * ProgressPage
 * -----------------------------------------------------------------------------
 * Responsibilities:
 * - Initialize dataset from template on first load.
 * - Render KPI, Chart, Cutoff controls, and Data Settings panel.
 * - Switch between Weekly / Monthly view without re-parsing Excel.
 *
 * Important:
 * - Weekly mode:
 *     cutoff key = ISO date "YYYY-MM-DD"
 *
 * - Monthly mode:
 *     cutoff key = month key "YYYY-MM"
 *     (store converts month -> last ISO date internally before applying cutoff)
 *
 * Browser/Vercel friendliness:
 * - Excel parsing happens once (in store).
 * - Chart is dynamically imported (no SSR).
 * - All derived values memoized where necessary.
 */

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useReportStore } from "../_state/reportStore";

import MetricCards from "./_components/MetricCards";
import CutoffControls from "./_components/CutoffControls";
import DataSettingsPanel from "./_components/DataSettingsPanel";
import SourceBadge from "./_components/SourceBadge";

import { buildProgressKpis } from "./_logic/buildKpis";

/**
 * Chart is client-only (Recharts).
 * Avoid SSR to keep Vercel build light.
 */
const SCurveChart = dynamic(() => import("./_components/SCurveChart"), {
  ssr: false,
});

export default function ProgressPage() {
  /**
   * -------------------------
   * Zustand bindings
   * -------------------------
   */

  const {
    progress,
    isLoading,
    error,
    initFromTemplate,

    viewMode,
    setViewMode,

    resetToTemplate,
    loadFromUpload,
    downloadTemplate,

    // Weekly cutoff state
    cutoffDraftWeekly,
    cutoffAppliedWeekly,

    // Monthly cutoff state
    cutoffDraftMonthly,
    cutoffAppliedMonthly,

    setCutoffDraft,
    applyCutoff,
    resetCutoffAuto,
  } = useReportStore();

  /**
   * Initialize template dataset once.
   */
  useEffect(() => {
    void initFromTemplate();
  }, [initFromTemplate]);

  /**
   * -------------------------
   * Derived data
   * -------------------------
   */

  /**
   * Select chart dataset based on current viewMode.
   */
  const chartData = progress
    ? viewMode === "weekly"
      ? progress.weekly
      : progress.monthly
    : [];

  /**
   * Build cutoff dropdown options based on viewMode:
   * - weekly  -> ISO dates
   * - monthly -> YYYY-MM
   */
  const cutoffOptions = useMemo(() => {
    if (!progress) return [];
    return viewMode === "weekly"
      ? progress.weekly.map((p) => p.week)
      : progress.monthly.map((p) => p.week);
  }, [progress, viewMode]);

  /**
   * Select current draft/applied cutoff keys based on viewMode.
   */
  const cutoffDraft =
    viewMode === "weekly" ? cutoffDraftWeekly : cutoffDraftMonthly;

  const cutoffApplied =
    viewMode === "weekly" ? cutoffAppliedWeekly : cutoffAppliedMonthly;

  /**
   * Build KPIs from current rendered dataset.
   * Recalculates only when dataset changes.
   */
  const kpis = useMemo(
    () => (progress ? buildProgressKpis(progress) : null),
    [progress],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-6">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Progress Report
          </h1>

          <div className="mt-2">
            {progress ? (
              <SourceBadge
                source={progress.source}
                filename={progress.filename}
              />
            ) : (
              <div className="text-xs text-muted-foreground">—</div>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            className={[
              "rounded-xl px-3 py-2 text-sm",
              viewMode === "weekly"
                ? "bg-surface-2 text-foreground shadow-card"
                : "border border-border bg-transparent text-muted-foreground hover:bg-surface-2",
            ].join(" ")}
            onClick={() => setViewMode("weekly")}
            disabled={isLoading}
          >
            Weekly
          </button>

          <button
            className={[
              "rounded-xl px-3 py-2 text-sm",
              viewMode === "monthly"
                ? "bg-surface-2 text-foreground shadow-card"
                : "border border-border bg-transparent text-muted-foreground hover:bg-surface-2",
            ].join(" ")}
            onClick={() => setViewMode("monthly")}
            disabled={isLoading}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1 — KPI                                                    */}
      {/* ------------------------------------------------------------------ */}
      {kpis && (
        <section className="mb-6">
          <MetricCards kpis={kpis} />
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2 — CHART                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="mb-6">
        {isLoading && <div className="text-muted-foreground">Working…</div>}

        {error && <div className="text-danger">Error: {error}</div>}

        {progress && (
          <SCurveChart
            data={chartData}
            /**
             * cutoffLabel:
             * - weekly  -> ISO date
             * - monthly -> YYYY-MM
             */
            cutoffLabel={progress.cutoffWeek}
          />
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3 — CUTOFF CONTROLS                                       */}
      {/* ------------------------------------------------------------------ */}
      {progress && (
        <section className="mb-6">
          <CutoffControls
            /**
             * weeks prop name kept for compatibility,
             * but now dynamically represents:
             * - weekly ISO dates
             * - monthly YYYY-MM
             */
            weeks={cutoffOptions}
            cutoffDraft={cutoffDraft}
            cutoffApplied={cutoffApplied}
            onChangeDraft={setCutoffDraft}
            onApply={applyCutoff}
            onReset={resetCutoffAuto}
            disabled={isLoading}
          />
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 4 — DATA SETTINGS (Secondary / Collapsible)               */}
      {/* ------------------------------------------------------------------ */}
      <DataSettingsPanel
        isLoading={isLoading}
        sourceLabel={
          progress
            ? `Using ${progress.source.toUpperCase()} · ${progress.filename}`
            : "Using —"
        }
        onDownloadTemplate={downloadTemplate}
        onResetToTemplate={() => void resetToTemplate()}
        onUpload={(file) => void loadFromUpload(file)}
      />

      {/* ------------------------------------------------------------------ */}
      {/* FOOTNOTE                                                           */}
      {/* ------------------------------------------------------------------ */}
      {progress && (
        <div className="mt-6 text-xs text-muted-foreground">
          Last parsed: {progress.updatedAtISO}
        </div>
      )}
    </main>
  );
}
