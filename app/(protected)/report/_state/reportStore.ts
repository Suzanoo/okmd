// app/report/_state/reportStore.ts
"use client";

import { create } from "zustand";
import type {
  ProgressDataset,
  ProgressPoint,
  ViewMode,
} from "../_data/models/progress";
import { loadTemplateProgressDataset } from "../_data/adapters/loadTemplateWorkbook";
import { parseUploadedProgressDataset } from "../_data/adapters/parseUploadedWorkbook";
import { applyCutoffToSeries } from "../progress/_logic/applyCutoff";

/**
 * Report Store (Zustand)
 * -----------------------------------------------------------------------------
 * Goals:
 * - Keep the app light on Vercel + browser by parsing Excel only once per load,
 *   then rendering UI from parsed JSON only.
 * - Support "Cutoff Draft" UX:
 *   user selects cutoff -> nothing changes until user clicks Render.
 *
 * Cutoff Strategy (IMPORTANT):
 * - Weekly mode cutoff key   = ISO date "YYYY-MM-DD"
 * - Monthly mode cutoff key  = month key "YYYY-MM"
 * - When user applies a monthly cutoff:
 *   we convert month key -> last ISO date within that month (from weeklyFull),
 *   then apply cutoff to weekly series, then rebuild monthly.
 */

type ReportState = {
  /** Parsed dataset used by UI. Charts read from here only. */
  progress: ProgressDataset | null;

  /** Full weekly series BEFORE cutoff is applied (for re-cutoff / re-render). */
  progressWeeklyFull: ProgressPoint[] | null;

  /** Loading state for template load / upload parse. */
  isLoading: boolean;

  /** User-friendly error message (validation, missing sheet, parse error, etc.). */
  error: string | null;

  /** Data-driven weekly cutoff (ISO date): last date where actual > 0. */
  cutoffAutoWeekly: string | null;

  /** Data-driven monthly cutoff (YYYY-MM) derived from cutoffAutoWeekly. */
  cutoffAutoMonthly: string | null;

  /** Weekly cutoff selection in UI (draft, not applied). */
  cutoffDraftWeekly: string | null;

  /** Weekly cutoff currently applied. */
  cutoffAppliedWeekly: string | null;

  /** Monthly cutoff selection in UI (draft, not applied). */
  cutoffDraftMonthly: string | null;

  /** Monthly cutoff currently applied. */
  cutoffAppliedMonthly: string | null;

  /** Weekly or Monthly view (UI toggle). */
  viewMode: ViewMode;

  // -------------------------
  // Actions: data source flow
  // -------------------------
  initFromTemplate: () => Promise<void>;
  resetToTemplate: () => Promise<void>;
  loadFromUpload: (file: File) => Promise<void>;
  downloadTemplate: () => void;

  // -------------------------
  // Actions: UX controls
  // -------------------------
  setViewMode: (mode: ViewMode) => void;
  setCutoffDraft: (key: string | null) => void;
  applyCutoff: () => void;
  resetCutoffAuto: () => void;
};

// -------------------------
// Guardrails (Browser/Vercel friendliness)
// -------------------------
const MAX_UPLOAD_MB = 15;
const MAX_TIMELINE_POINTS = 500;

function nowISO(): string {
  return new Date().toISOString();
}

function monthKeyFromISODate(dateISO: string): string {
  // YYYY-MM-DD -> YYYY-MM
  return dateISO.slice(0, 7);
}

function lastISODateInMonth(weeklyFull: ProgressPoint[], mk: string): string | null {
  // weeklyFull assumed sorted ascending by date
  let last: string | null = null;
  for (const p of weeklyFull) {
    if (typeof p.week === "string" && p.week.startsWith(mk)) last = p.week;
  }
  return last;
}

/**
 * Monthly series from weekly (date-based):
 * pick the last data point of each month (YYYY-MM).
 *
 * Output uses:
 * - week = month key "YYYY-MM"
 */
function buildMonthlyFromWeekly(weekly: ProgressPoint[]): ProgressPoint[] {
  const lastByMonth = new Map<string, ProgressPoint>();

  for (const p of weekly) {
    const mk = monthKeyFromISODate(p.week);
    lastByMonth.set(mk, p);
  }

  return Array.from(lastByMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mk, p]) => ({
      week: mk, // month key
      plan: p.plan,
      actual: p.actual,
    }));
}

/**
 * Helper: ingest a parsed dataset and initialize store fields consistently.
 * Keeps weeklyFull separately so cutoff can be re-applied later.
 */
function hydrateFromDataset(ds: ProgressDataset): Partial<ReportState> {
  const weeklyFull = ds.weekly.map((p) => ({ ...p }));

  const cutoffAutoWeekly = ds.cutoffWeek ?? null; // ISO date
  const cutoffAutoMonthly = cutoffAutoWeekly ? monthKeyFromISODate(cutoffAutoWeekly) : null;

  // Initial render uses auto weekly cutoff
  const weeklyRendered = applyCutoffToSeries(weeklyFull, cutoffAutoWeekly);
  const monthlyRendered = buildMonthlyFromWeekly(weeklyRendered);

  return {
    progressWeeklyFull: weeklyFull,
    progress: {
      ...ds,
      weekly: weeklyRendered,
      monthly: monthlyRendered,
      cutoffWeek: cutoffAutoWeekly, // keep as ISO date for initial weekly view
      viewMode: "weekly",
      updatedAtISO: ds.updatedAtISO || nowISO(),
    },

    cutoffAutoWeekly,
    cutoffAutoMonthly,

    cutoffDraftWeekly: cutoffAutoWeekly,
    cutoffAppliedWeekly: cutoffAutoWeekly,

    cutoffDraftMonthly: cutoffAutoMonthly,
    cutoffAppliedMonthly: cutoffAutoMonthly,

    viewMode: "weekly",
  };
}

export const useReportStore = create<ReportState>((set, get) => ({
  progress: null,
  progressWeeklyFull: null,
  isLoading: false,
  error: null,

  cutoffAutoWeekly: null,
  cutoffAutoMonthly: null,

  cutoffDraftWeekly: null,
  cutoffAppliedWeekly: null,

  cutoffDraftMonthly: null,
  cutoffAppliedMonthly: null,

  viewMode: "weekly",

  // -------------------------
  // Data source flow
  // -------------------------

  initFromTemplate: async () => {
    if (get().progress) return;

    set({ isLoading: true, error: null });
    try {
      const ds = await loadTemplateProgressDataset();

      // Guard timeline size (template should be safe, but keep it consistent)
      if (ds.weekly.length > MAX_TIMELINE_POINTS) {
        set({
          isLoading: false,
          error: `Template timeline too wide (${ds.weekly.length}). Reduce to <= ${MAX_TIMELINE_POINTS}.`,
        });
        return;
      }

      set({ ...hydrateFromDataset(ds), isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  resetToTemplate: async () => {
    set({ isLoading: true, error: null });
    try {
      const ds = await loadTemplateProgressDataset();

      if (ds.weekly.length > MAX_TIMELINE_POINTS) {
        set({
          isLoading: false,
          error: `Template timeline too wide (${ds.weekly.length}). Reduce to <= ${MAX_TIMELINE_POINTS}.`,
        });
        return;
      }

      set({ ...hydrateFromDataset(ds), isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  loadFromUpload: async (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx")) {
      set({ error: "Please upload an .xlsx file." });
      return;
    }

    const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      set({
        error: `File too large (${(file.size / (1024 * 1024)).toFixed(
          1
        )} MB). Max allowed is ${MAX_UPLOAD_MB} MB.`,
      });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const ds = await parseUploadedProgressDataset(file);

      if (ds.weekly.length > MAX_TIMELINE_POINTS) {
        set({
          isLoading: false,
          error: `Too many timeline points (${ds.weekly.length}). Please reduce to <= ${MAX_TIMELINE_POINTS} weekly columns.`,
        });
        return;
      }

      set({ ...hydrateFromDataset(ds), isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Unknown error",
        isLoading: false,
      });
    }
  },

  downloadTemplate: () => {
    const a = document.createElement("a");
    a.href = "/templates/okmd_progress_template.xlsx";
    a.download = "okmd_progress_template.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  // -------------------------
  // UX controls
  // -------------------------

  setViewMode: (mode) => {
    set({ viewMode: mode });

    const p = get().progress;
    if (!p) return;

    // Sync dataset viewMode too (convenient for UI)
    set({ progress: { ...p, viewMode: mode } });
  },

  /**
   * Update cutoff draft for the current viewMode.
   * - weekly: expects ISO date "YYYY-MM-DD"
   * - monthly: expects month key "YYYY-MM"
   */
  setCutoffDraft: (key) => {
    const mode = get().viewMode;
    if (mode === "weekly") set({ cutoffDraftWeekly: key });
    else set({ cutoffDraftMonthly: key });
  },

  /**
   * Apply cutoff draft for the current viewMode:
   * - weekly: apply ISO date directly
   * - monthly: convert YYYY-MM -> last ISO date in that month, then apply
   */
  applyCutoff: () => {
    const { progress, progressWeeklyFull, viewMode } = get();
    if (!progress || !progressWeeklyFull) return;

    const draftKey = viewMode === "weekly" ? get().cutoffDraftWeekly : get().cutoffDraftMonthly;

    const cutoffDate =
      viewMode === "weekly"
        ? draftKey
        : draftKey
        ? lastISODateInMonth(progressWeeklyFull, draftKey)
        : null;

    const weeklyRendered = applyCutoffToSeries(progressWeeklyFull, cutoffDate);
    const monthlyRendered = buildMonthlyFromWeekly(weeklyRendered);

    // Update applied keys per mode
    if (viewMode === "weekly") set({ cutoffAppliedWeekly: draftKey ?? null });
    else set({ cutoffAppliedMonthly: draftKey ?? null });

    set({
      progress: {
        ...progress,
        // For weekly view we show ISO date, for monthly view we show YYYY-MM
        cutoffWeek: draftKey ?? null,
        weekly: weeklyRendered,
        monthly: monthlyRendered,
      },
    });
  },

  /**
   * Reset cutoff draft to "auto" for the current viewMode and apply immediately.
   */
  resetCutoffAuto: () => {
    const mode = get().viewMode;

    if (mode === "weekly") {
      set({ cutoffDraftWeekly: get().cutoffAutoWeekly });
    } else {
      set({ cutoffDraftMonthly: get().cutoffAutoMonthly });
    }

    get().applyCutoff();
  },
}));
