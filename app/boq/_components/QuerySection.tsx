"use client";

import { useMemo, useState, useCallback } from "react";
import type { BoqRow } from "@/lib/boq/types";
import {
  buildDescriptionRegex,
  filterByDescription,
  toCSV,
} from "@/lib/boq/query";
import { highlightText } from "@/lib/boq/highlight";
import { useThemeStore } from "@/lib/theme/store";

import MultiSelectDropdown from "./controls/MultiSelectDropdown";

/** จำนวนแถวต่อหน้าในตารางผลลัพธ์ */
const PAGE_SIZE = 20;

type Props = {
  /** BOQ rows ทั้งหมด (source of truth) */
  rows: BoqRow[];
};

type MatchMode = "all" | "any";

/**
 * WorkingRow = row หลังจาก search แล้ว + เพิ่ม _id สำหรับ:
 * - key ใน React table
 * - staging (pending remove) แบบปลอดภัย
 */
type WorkingRow = BoqRow & {
  _id: string;
};

/**
 * Filters ที่ใช้เฉพาะ "หัวตาราง" (หลังจาก search แล้ว)
 * เป็น multi-select ทั้งหมด
 */
type TableFilters = {
  wbs1: string[];
  wbs2: string[];
  wbs3: string[];
  wbs4: string[];
  unit: string[]; // ✅ เพิ่ม Unit filter
};

type QtyByUnit = { unit: string; qty: number };

/** สร้าง id แบบ deterministic เพื่อให้ toggle/ลบได้ตรงตัว */
function makeRowId(r: BoqRow, i: number) {
  return [
    r.wbs1,
    r.wbs2,
    r.wbs3,
    r.wbs4,
    r.description,
    r.unit,
    String(r.qty),
    String(r.amount),
    String(i),
  ].join("||");
}

/** แปลง number ที่อาจเป็น null/undefined ให้ปลอดภัย */
const safeNum = (v: number | null | undefined) =>
  typeof v === "number" ? v : 0;

/** format จำนวนเต็ม (ตารางเว็บ) */
const fmtInt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/** format ทศนิยม 2 ตำแหน่ง (PDF/summary) */
const fmtNum = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });

/** normalize unit เพื่อให้ filter/summary สม่ำเสมอ */
const normalizeUnit = (u: string | null | undefined) => (u ?? "").trim() || "-";

/** รวม Qty ตาม unit สำหรับ summary */
function sumByUnit(rows: WorkingRow[]): QtyByUnit[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const u = normalizeUnit(r.unit);
    m.set(u, (m.get(u) ?? 0) + safeNum(r.qty));
  }
  return Array.from(m, ([unit, qty]) => ({ unit, qty })).sort((a, b) =>
    a.unit.localeCompare(b.unit),
  );
}

export default function QuerySection({ rows }: Props) {
  const isDark = useThemeStore((s) => s.theme) === "dark";

  // =========================
  // 1) UI STATE (source-of-truth)
  // =========================

  /** input ข้อความสำหรับค้นหา Description */
  const [input, setInput] = useState("");

  /** workingRows = ผล search แล้ว (และหลัง Apply removal แล้ว) */
  const [workingRows, setWorkingRows] = useState<WorkingRow[]>([]);

  /** staging สำหรับ "pending remove" (กด x แล้ว highlight ไว้ก่อน) */
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(
    () => new Set(),
  );

  /** ข้อความ error สำหรับ regex/ค้นหา */
  const [error, setError] = useState("");

  /** pagination */
  const [page, setPage] = useState(1);

  /** matchMode: all words vs any word */
  const [matchMode, setMatchMode] = useState<MatchMode>("all");

  /** table header filters */
  const [tf, setTf] = useState<TableFilters>({
    wbs1: [],
    wbs2: [],
    wbs3: [],
    wbs4: [],
    unit: [], // ✅
  });

  // =========================
  // 2) DERIVED DATA (computed)
  // =========================

  /** keywords สำหรับ highlight ใน Description (split ตาม space) */
  const keywords = useMemo(
    () => input.trim().split(/\s+/).filter(Boolean),
    [input],
  );

  /**
   * filteredWorkingRows = workingRows ที่ถูกกรองด้วย header filters (WBS + Unit)
   * NOTE: ไม่รวม pending remove เพราะ pending ยังไม่ลบจริง
   */
  const filteredWorkingRows = useMemo(() => {
    return workingRows.filter((r) => {
      if (tf.wbs1.length && !tf.wbs1.includes(r.wbs1)) return false;
      if (tf.wbs2.length && !tf.wbs2.includes(r.wbs2)) return false;
      if (tf.wbs3.length && !tf.wbs3.includes(r.wbs3)) return false;
      if (tf.wbs4.length && !tf.wbs4.includes(r.wbs4)) return false;

      // ✅ Unit filter
      const u = normalizeUnit(r.unit);
      if (tf.unit.length && !tf.unit.includes(u)) return false;

      return true;
    });
  }, [workingRows, tf]);

  /** pending count เฉพาะใน view ปัจจุบัน (หลังกรอง header แล้ว) */
  const pendingCountInFiltered = useMemo(() => {
    if (pendingRemoveIds.size === 0) return 0;
    let c = 0;
    for (const r of filteredWorkingRows) if (pendingRemoveIds.has(r._id)) c++;
    return c;
  }, [filteredWorkingRows, pendingRemoveIds]);

  /** pagination computed */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredWorkingRows.length / PAGE_SIZE),
  );

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredWorkingRows.slice(start, start + PAGE_SIZE);
  }, [filteredWorkingRows, page]);

  /** summary based on "applied state" (หลัง filter + applied removal) */
  const sumAmount = useMemo(
    () => filteredWorkingRows.reduce((acc, r) => acc + safeNum(r.amount), 0),
    [filteredWorkingRows],
  );

  const qtyByUnit = useMemo(
    () => sumByUnit(filteredWorkingRows),
    [filteredWorkingRows],
  );

  // =========================
  // 3) ACTIONS / HELPERS
  // =========================

  /** reset filters + page */
  const resetFilters = useCallback(() => {
    setTf({ wbs1: [], wbs2: [], wbs3: [], wbs4: [], unit: [] });
    setPage(1);
  }, []);

  /** clear staging removal */
  const clearPending = useCallback(() => {
    setPendingRemoveIds(new Set());
  }, []);

  /** helper: patch filters แล้ว reset page (ใช้กับ dropdown) */
  const patchFilters = useCallback((patch: Partial<TableFilters>) => {
    setTf((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  /** toggle pending row remove (highlight only) */
  const togglePending = useCallback((id: string) => {
    setPendingRemoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // NOTE: ไม่ reset page เพื่อรักษา UX (user ไม่หลุดหน้าที่กำลังดู)
  }, []);

  /**
   * Search: สร้าง workingRows ใหม่จาก source rows
   * - reset error/page/filters/pending ก่อน
   * - filter amount > 0 ตามที่ต้องการ
   */
  const onSearch = useCallback(() => {
    setError("");
    setPage(1);
    setTf({ wbs1: [], wbs2: [], wbs3: [], wbs4: [], unit: [] });
    setPendingRemoveIds(new Set());

    const regex = buildDescriptionRegex(input, matchMode);
    if (!regex) {
      setWorkingRows([]);
      return;
    }

    try {
      const filtered = filterByDescription(rows, regex).filter(
        (r) => r.amount > 0,
      );
      const w: WorkingRow[] = filtered.map((r, i) => ({
        ...r,
        _id: makeRowId(r, i),
      }));
      setWorkingRows(w);
    } catch {
      setError("Invalid search pattern");
      setWorkingRows([]);
    }
  }, [input, matchMode, rows]);

  /**
   * Apply pending removals:
   * - ลบจริงจาก workingRows
   * - clamp page ให้ไม่เกิน total pages หลังลบ
   */
  const applyPendingRemovals = useCallback(() => {
    if (pendingRemoveIds.size === 0) return;

    const newLen = filteredWorkingRows.length - pendingCountInFiltered;
    const newTotalPages = Math.max(1, Math.ceil(newLen / PAGE_SIZE));
    setPage((p) => Math.min(p, newTotalPages));

    setWorkingRows((prev) => prev.filter((r) => !pendingRemoveIds.has(r._id)));
    clearPending();
  }, [
    clearPending,
    filteredWorkingRows.length,
    pendingCountInFiltered,
    pendingRemoveIds,
  ]);

  // =========================
  // 4) EXPORT (CSV / PDF)
  // =========================

  /** Export CSV จาก state ปัจจุบัน (หลัง header filters + applied removals) */
  const onDownloadCSV = useCallback(() => {
    const csv = toCSV(filteredWorkingRows.map(({ _id, ...rest }) => rest));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "boq_query_result.csv";
    a.click();

    URL.revokeObjectURL(url);
  }, [filteredWorkingRows]);

  /**
   * Export PDF (client-side)
   * - registerThaiFont เพื่อให้ภาษาไทยไม่เพี้ยน
   * - auto-fit width เพื่อไม่ให้ตารางล้นหน้า
   */
  const onExportPDF = useCallback(async () => {
    const data = filteredWorkingRows;

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const { registerThaiFont } = await import("@/lib/pdf/registerThaiFont");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });
    await registerThaiFont(doc);

    const marginX = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const available = pageWidth - marginX * 2;

    const w = { wbs: 42, unit: 40, qty: 48, money: 62 };
    const fixed = w.wbs * 4 + w.unit + w.qty + w.money * 3;
    const descW = Math.max(180, available - fixed);

    doc.setFont("Sarabun", "normal");
    doc.setFontSize(14);
    doc.text(
      `BOQ Query Result (${data.length.toLocaleString()} rows)`,
      marginX,
      32,
    );

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, 46);

    const head = [
      [
        "WBS-1",
        "WBS-2",
        "WBS-3",
        "WBS-4",
        "Description",
        "Unit",
        "Qty",
        "Material",
        "Labor",
        "Amount",
      ],
    ];

    const body = data.map((r) => [
      r.wbs1 ?? "",
      r.wbs2 ?? "",
      r.wbs3 ?? "",
      r.wbs4 ?? "",
      r.description ?? "",
      normalizeUnit(r.unit),
      fmtNum(safeNum(r.qty)),
      fmtNum(safeNum(r.material)),
      fmtNum(safeNum(r.labor)),
      fmtNum(safeNum(r.amount)),
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 52,
      margin: { left: marginX, right: marginX },
      tableWidth: available,
      styles: {
        font: "Sarabun",
        fontStyle: "normal",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        font: "Sarabun",
        fontStyle: "bold",
        fillColor: [230, 230, 230],
        textColor: [30, 30, 30],
      },
      columnStyles: {
        0: { cellWidth: w.wbs },
        1: { cellWidth: w.wbs },
        2: { cellWidth: w.wbs },
        3: { cellWidth: w.wbs },
        4: { cellWidth: descW },
        5: { cellWidth: w.unit },
        6: { halign: "right", cellWidth: w.qty },
        7: { halign: "right", cellWidth: w.money },
        8: { halign: "right", cellWidth: w.money },
        9: { halign: "right", cellWidth: w.money },
      },
      didDrawPage: () => {
        const pageNo = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(
          `Page ${pageNo}`,
          pageWidth - marginX,
          doc.internal.pageSize.getHeight() - 18,
          {
            align: "right",
          },
        );
      },
    });

    const sum = data.reduce((acc, r) => acc + safeNum(r.amount), 0);
    const qtyUnits = sumByUnit(data);

    const last = doc as unknown as { lastAutoTable?: { finalY?: number } };
    const y = (last.lastAutoTable?.finalY ?? 740) + 18;

    doc.setFontSize(10);
    doc.text(`Sum Amount: ${fmtNum(sum)}`, marginX, y);

    const qtyText = qtyUnits
      .map((x) => `${fmtNum(x.qty)} ${x.unit}`)
      .join(" | ");
    doc.text(`Sum Qty (by Unit): ${qtyText || "-"}`, marginX, y + 14);

    doc.save("boq_query_result.pdf");
  }, [filteredWorkingRows]);

  // =========================
  // 5) FILTER OPTIONS (for dropdowns)
  // =========================

  const wbs1Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) s.add(r.wbs1);
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows]);

  const wbs2Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) {
      if (tf.wbs1.length && !tf.wbs1.includes(r.wbs1)) continue;
      s.add(r.wbs2);
    }
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows, tf.wbs1]);

  const wbs3Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) {
      if (tf.wbs1.length && !tf.wbs1.includes(r.wbs1)) continue;
      if (tf.wbs2.length && !tf.wbs2.includes(r.wbs2)) continue;
      s.add(r.wbs3);
    }
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows, tf.wbs1, tf.wbs2]);

  const wbs4Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) {
      if (tf.wbs1.length && !tf.wbs1.includes(r.wbs1)) continue;
      if (tf.wbs2.length && !tf.wbs2.includes(r.wbs2)) continue;
      if (tf.wbs3.length && !tf.wbs3.includes(r.wbs3)) continue;
      s.add(r.wbs4);
    }
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows, tf.wbs1, tf.wbs2, tf.wbs3]);

  /** ✅ Unit options (simple: ไม่ cascade เพื่อให้เลือก unit ได้เสมอ) */
  const unitOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) s.add(normalizeUnit(r.unit));
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows]);

  // =========================
  // 6) UI TOKENS (tailwind strings)
  // =========================

  const card =
    "rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-card)]";
  const muted = "text-[color:var(--color-muted-foreground)]";
  const fg = "text-[color:var(--color-foreground)]";

  const inputCls =
    "h-10 flex-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 text-sm " +
    "text-[color:var(--color-foreground)] shadow-[var(--shadow-input)] outline-none " +
    "focus:ring-2 focus:ring-[color:var(--color-accent)]/35";

  const checkboxWrap = "flex items-center gap-2 text-xs";
  const checkboxCls =
    "h-4 w-4 rounded border border-[color:var(--color-border)] accent-[color:var(--color-accent)]";

  const btnPrimary =
    "inline-flex items-center justify-center gap-2 h-10 rounded-xl " +
    "bg-[color:var(--color-accent)] px-4 text-sm font-medium text-white " +
    "shadow-[var(--shadow-input)] " +
    "transition-all duration-150 ease-out " +
    "hover:-translate-y-[1px] hover:shadow-lg hover:brightness-110 " +
    "active:translate-y-0 active:scale-[0.98] active:shadow-md " +
    "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40 " +
    "disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100";

  const btnGhost =
    "inline-flex items-center justify-center gap-2 rounded-xl " +
    "border border-[color:var(--color-border)] " +
    "bg-[color:var(--color-surface-2)] px-3 py-1.5 text-xs " +
    "text-[color:var(--color-foreground)] " +
    "shadow-[var(--shadow-input)] " +
    "transition-all duration-150 ease-out " +
    "hover:-translate-y-[1px] hover:shadow-md hover:border-[color:var(--color-accent)]/35 " +
    "active:translate-y-0 active:scale-[0.98] active:shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/35 " +
    "disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0 disabled:active:scale-100";

  const tableWrap =
    "overflow-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]";
  const thead =
    "sticky top-0 z-10 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]";
  const th = `p-2 text-left text-xs font-semibold ${muted}`;
  const td = `p-2 text-xs ${fg}`;
  const tdNum = `p-2 text-xs text-right ${fg}`;
  const rowBase =
    "border-t border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-2)]/70";

  const emptyBox =
    "rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 text-sm " +
    "text-[color:var(--color-muted-foreground)]";

  const markWrap =
    "[&>mark]:rounded [&>mark]:px-0.5 " +
    (isDark
      ? "[&>mark]:bg-amber-400/25 [&>mark]:text-amber-200"
      : "[&>mark]:bg-yellow-200 [&>mark]:text-slate-900");

  const pendingRowCls = isDark ? "bg-red-500/10" : "bg-rose-50";

  // =========================
  // 7) RENDER
  // =========================

  return (
    <section className={`${card} space-y-4`}>
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className={`text-lg font-semibold ${fg}`}>BOQ Query</h2>
          <div className={`mt-1 text-xs ${muted}`}>
            • ค้นหา Description • WBS/Unit filter เลือกได้หลายค่า •
            เลือกแถวตัดออก (pending) • Apply ทีเดียว
          </div>
        </div>
        <div className={`text-xs ${muted}`}>
          Page size: <span className={`${fg} font-medium`}>{PAGE_SIZE}</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ค้นหา Description (Thai / English)"
          className={inputCls}
        />

        <label className={checkboxWrap}>
          <input
            className={checkboxCls}
            type="checkbox"
            checked={matchMode === "any"}
            onChange={(e) => setMatchMode(e.target.checked ? "any" : "all")}
          />
          <span className={muted}>Match any word</span>
        </label>

        <button type="button" onClick={onSearch} className={btnPrimary}>
          Search
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {/* Result */}
      {workingRows.length > 0 ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className={`text-sm ${muted}`}>
              พบ{" "}
              <span className={`${fg} font-medium`}>
                {filteredWorkingRows.length.toLocaleString()}
              </span>{" "}
              รายการ
              {pendingCountInFiltered > 0 ? (
                <>
                  {" "}
                  • เลือกตัดออก{" "}
                  <span className={`${fg} font-medium`}>
                    {pendingCountInFiltered.toLocaleString()}
                  </span>{" "}
                  รายการ (ยังไม่ลบจริง)
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={applyPendingRemovals}
                disabled={pendingCountInFiltered === 0}
                className={btnGhost}
              >
                Apply
              </button>
              <button
                type="button"
                onClick={clearPending}
                disabled={pendingCountInFiltered === 0}
                className={btnGhost}
              >
                Undo
              </button>
              <button type="button" onClick={resetFilters} className={btnGhost}>
                Clear filters
              </button>
              <button type="button" onClick={onExportPDF} className={btnGhost}>
                Export PDF
              </button>
              <button
                type="button"
                onClick={onDownloadCSV}
                className={btnGhost}
              >
                Download CSV
              </button>
            </div>
          </div>

          {/* Table */}
          <div className={tableWrap}>
            <table className="w-full min-w-[1100px] text-xs">
              <thead className={thead}>
                <tr>
                  <th className={th}>
                    <MultiSelectDropdown
                      label="WBS-1"
                      options={wbs1Options.map((v) => ({ value: v }))}
                      value={tf.wbs1}
                      onChange={(next) =>
                        patchFilters({
                          wbs1: next,
                          wbs2: [],
                          wbs3: [],
                          wbs4: [],
                        })
                      }
                      placeholder="All"
                    />
                  </th>

                  <th className={th}>
                    <MultiSelectDropdown
                      label="WBS-2"
                      options={wbs2Options.map((v) => ({ value: v }))}
                      value={tf.wbs2}
                      onChange={(next) =>
                        patchFilters({ wbs2: next, wbs3: [], wbs4: [] })
                      }
                      placeholder="All"
                      disabled={wbs2Options.length === 0}
                    />
                  </th>

                  <th className={th}>
                    <MultiSelectDropdown
                      label="WBS-3"
                      options={wbs3Options.map((v) => ({ value: v }))}
                      value={tf.wbs3}
                      onChange={(next) =>
                        patchFilters({ wbs3: next, wbs4: [] })
                      }
                      placeholder="All"
                      disabled={wbs3Options.length === 0}
                    />
                  </th>

                  <th className={th}>
                    <MultiSelectDropdown
                      label="WBS-4"
                      options={wbs4Options.map((v) => ({ value: v }))}
                      value={tf.wbs4}
                      onChange={(next) => patchFilters({ wbs4: next })}
                      placeholder="All"
                      disabled={wbs4Options.length === 0}
                    />
                  </th>

                  <th className={th}>Description</th>

                  {/* ✅ Unit filter column */}
                  <th className={th}>
                    <MultiSelectDropdown
                      label="Unit"
                      options={unitOptions.map((v) => ({ value: v }))}
                      value={tf.unit}
                      onChange={(next) => patchFilters({ unit: next })}
                      placeholder="All"
                      disabled={unitOptions.length === 0}
                    />
                  </th>

                  <th className={`${th} text-right`}>Qty</th>
                  <th className={`${th} text-right`}>Material</th>
                  <th className={`${th} text-right`}>Labor</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={`${th} text-right`}> </th>
                </tr>
              </thead>

              <tbody>
                {pageData.map((r) => {
                  const pending = pendingRemoveIds.has(r._id);
                  return (
                    <tr
                      key={r._id}
                      className={`${rowBase} ${pending ? pendingRowCls : ""}`}
                    >
                      <td className={td}>{r.wbs1}</td>
                      <td className={td}>{r.wbs2}</td>
                      <td className={td}>{r.wbs3}</td>
                      <td className={td}>{r.wbs4}</td>

                      <td className={td}>
                        <span className={markWrap}>
                          {highlightText(r.description, keywords)}
                        </span>
                        {pending ? (
                          <span className={`ml-2 text-[11px] ${muted}`}>
                            (pending remove)
                          </span>
                        ) : null}
                      </td>

                      <td className={td}>{normalizeUnit(r.unit)}</td>
                      <td className={tdNum}>{fmtInt(safeNum(r.qty))}</td>
                      <td className={tdNum}>{fmtInt(safeNum(r.material))}</td>
                      <td className={tdNum}>{fmtInt(safeNum(r.labor))}</td>
                      <td className={`${tdNum} font-semibold`}>
                        {fmtInt(safeNum(r.amount))}
                      </td>

                      <td className="p-2 text-right">
                        <button
                          type="button"
                          className={
                            "h-7 w-7 rounded-lg border border-[color:var(--color-border)] " +
                            "bg-[color:var(--color-surface-2)] text-xs text-[color:var(--color-foreground)] " +
                            "transition-all duration-150 hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:scale-[0.98]"
                          }
                          onClick={() => togglePending(r._id)}
                          aria-label={
                            pending ? "Undo remove" : "Mark to remove"
                          }
                          title={pending ? "Undo" : "Mark to remove"}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="border-t border-[color:var(--color-border)]">
                  <td className="p-3 text-xs" colSpan={6}>
                    <div className={`font-semibold ${fg}`}>Summary</div>
                    <div className={`mt-1 text-[11px] ${muted}`}>
                      Sum Qty (by Unit):{" "}
                      <span className={fg}>
                        {qtyByUnit.length
                          ? qtyByUnit
                              .map((x) => `${fmtNum(x.qty)} ${x.unit}`)
                              .join("  |  ")
                          : "-"}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 text-xs text-right" colSpan={4}>
                    <div className={`text-[11px] ${muted}`}>Sum Amount</div>
                    <div className={`text-sm font-semibold ${fg}`}>
                      {fmtInt(sumAmount)}
                    </div>
                  </td>

                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs">
            <div className={muted}>
              Page <span className={`${fg} font-medium`}>{page}</span> /{" "}
              <span className={`${fg} font-medium`}>{totalPages}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={btnGhost}
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={btnGhost}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className={emptyBox}>ยังไม่มีผลลัพธ์</div>
      )}
    </section>
  );
}
