"use client";

import { useMemo, useState } from "react";
import type { BoqRow } from "@/lib/boq/types";
import {
  buildDescriptionRegex,
  filterByDescription,
  toCSV,
} from "@/lib/boq/query";
import { highlightText } from "@/lib/boq/highlight";
import { useThemeStore } from "@/lib/theme/store";

const PAGE_SIZE = 20;

type Props = {
  rows: BoqRow[];
};

type MatchMode = "all" | "any";

type WorkingRow = BoqRow & {
  _id: string; // for staging/remove safely
};

type TableFilters = {
  wbs1: string | null;
  wbs2: string | null;
  wbs3: string | null;
  wbs4: string | null;
};

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

function sumByUnit(rows: WorkingRow[]) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const u = (r.unit ?? "").trim() || "-";
    m.set(u, (m.get(u) ?? 0) + (r.qty ?? 0));
  }
  return Array.from(m, ([unit, qty]) => ({ unit, qty })).sort((a, b) =>
    a.unit.localeCompare(b.unit),
  );
}

export default function QuerySection({ rows }: Props) {
  const isDark = useThemeStore((s) => s.theme) === "dark";

  const [input, setInput] = useState("");
  const [result, setResult] = useState<BoqRow[]>([]);

  // Working table rows (after search; real data state)
  const [workingRows, setWorkingRows] = useState<WorkingRow[]>([]);

  // NEW: pending removal (highlight only until Apply)
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [matchMode, setMatchMode] = useState<MatchMode>("all");

  // Header filters (table-only)
  const [tf, setTf] = useState<TableFilters>({
    wbs1: null,
    wbs2: null,
    wbs3: null,
    wbs4: null,
  });

  const keywords = useMemo(
    () => input.trim().split(/\s+/).filter(Boolean),
    [input],
  );

  function resetTableFilters() {
    setTf({ wbs1: null, wbs2: null, wbs3: null, wbs4: null });
  }

  function clearPending() {
    setPendingRemoveIds(new Set());
  }

  function togglePending(id: string) {
    setPendingRemoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // IMPORTANT: do NOT setPage(1) here — keep UX stable
  }

  function onSearch() {
    setError("");
    setPage(1);
    resetTableFilters();
    clearPending();

    const regex = buildDescriptionRegex(input, matchMode);
    if (!regex) {
      setResult([]);
      setWorkingRows([]);
      return;
    }

    try {
      // keep only rows with amount > 0 (as you requested)
      const filtered = filterByDescription(rows, regex).filter(
        (r) => r.amount > 0,
      );
      setResult(filtered);

      const w = filtered.map((r, i) => ({ ...r, _id: makeRowId(r, i) }));
      setWorkingRows(w);
    } catch {
      setError("Invalid search pattern");
    }
  }

  // Apply header filters on workingRows
  const filteredWorkingRows = useMemo(() => {
    return workingRows.filter((r) => {
      if (tf.wbs1 && r.wbs1 !== tf.wbs1) return false;
      if (tf.wbs2 && r.wbs2 !== tf.wbs2) return false;
      if (tf.wbs3 && r.wbs3 !== tf.wbs3) return false;
      if (tf.wbs4 && r.wbs4 !== tf.wbs4) return false;
      return true;
    });
  }, [workingRows, tf.wbs1, tf.wbs2, tf.wbs3, tf.wbs4]);

  // Pending count in current filtered view (what Apply will remove)
  const pendingCountInFiltered = useMemo(() => {
    if (pendingRemoveIds.size === 0) return 0;
    let c = 0;
    for (const r of filteredWorkingRows) if (pendingRemoveIds.has(r._id)) c++;
    return c;
  }, [filteredWorkingRows, pendingRemoveIds]);

  function applyPendingRemovals() {
    if (pendingRemoveIds.size === 0) return;

    // compute new total pages (based on filtered view) then clamp page
    const newLen = filteredWorkingRows.length - pendingCountInFiltered;
    const newTotalPages = Math.max(1, Math.ceil(newLen / PAGE_SIZE));
    setPage((p) => Math.min(p, newTotalPages));

    // remove from the real workingRows
    setWorkingRows((prev) => prev.filter((r) => !pendingRemoveIds.has(r._id)));

    // clear staging
    clearPending();
  }

  function onDownloadCSV() {
    // export current REAL table state (after filters + applied removals)
    const csv = toCSV(filteredWorkingRows.map(({ _id, ...rest }) => rest));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "boq_query_result.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  async function onExportPDF() {
    const data = filteredWorkingRows;

    const [{ jsPDF }, autoTableMod] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const title = `BOQ Query Result (${data.length} rows)`;
    doc.setFontSize(14);
    doc.text(title, 40, 36);

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
      r.wbs1,
      r.wbs2,
      r.wbs3,
      r.wbs4,
      r.description,
      r.unit,
      String(r.qty ?? 0),
      String(r.material ?? 0),
      String(r.labor ?? 0),
      String(r.amount ?? 0),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (autoTableMod as any).default(doc, {
      head,
      body,
      startY: 52,
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [230, 230, 230], textColor: [30, 30, 30] },
      columnStyles: {
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right" },
        9: { halign: "right" },
      },
    });

    const sumAmount = data.reduce((acc, r) => acc + (r.amount ?? 0), 0);
    const qtyUnits = sumByUnit(data);
    const y = (doc as any).lastAutoTable?.finalY
      ? (doc as any).lastAutoTable.finalY + 18
      : 760;

    doc.setFontSize(10);
    doc.text(`Sum Amount: ${sumAmount.toLocaleString()}`, 40, y);

    const qtyText = qtyUnits
      .map((x) => `${x.qty.toLocaleString()} ${x.unit}`)
      .join(" | ");

    doc.text(`Sum Qty (by Unit): ${qtyText || "-"}`, 40, y + 14);

    doc.save("boq_query_result.pdf");
  }

  // ===== Pagination =====
  const totalPages = Math.max(
    1,
    Math.ceil(filteredWorkingRows.length / PAGE_SIZE),
  );
  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredWorkingRows.slice(start, start + PAGE_SIZE);
  }, [filteredWorkingRows, page]);

  // ===== Header filter options (from current workingRows; cascading-ish) =====
  const wbs1Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) s.add(r.wbs1);
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows]);

  const wbs2Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) {
      if (tf.wbs1 && r.wbs1 !== tf.wbs1) continue;
      s.add(r.wbs2);
    }
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows, tf.wbs1]);

  const wbs3Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) {
      if (tf.wbs1 && r.wbs1 !== tf.wbs1) continue;
      if (tf.wbs2 && r.wbs2 !== tf.wbs2) continue;
      s.add(r.wbs3);
    }
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows, tf.wbs1, tf.wbs2]);

  const wbs4Options = useMemo(() => {
    const s = new Set<string>();
    for (const r of workingRows) {
      if (tf.wbs1 && r.wbs1 !== tf.wbs1) continue;
      if (tf.wbs2 && r.wbs2 !== tf.wbs2) continue;
      if (tf.wbs3 && r.wbs3 !== tf.wbs3) continue;
      s.add(r.wbs4);
    }
    return Array.from(s).filter(Boolean).sort();
  }, [workingRows, tf.wbs1, tf.wbs2, tf.wbs3]);

  // ===== Summary (based on applied state only) =====
  const sumAmount = useMemo(
    () => filteredWorkingRows.reduce((acc, r) => acc + (r.amount ?? 0), 0),
    [filteredWorkingRows],
  );
  const qtyByUnit = useMemo(
    () => sumByUnit(filteredWorkingRows),
    [filteredWorkingRows],
  );

  // ===== Local UI tokens =====
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
    "h-10 rounded-xl bg-[color:var(--color-accent)] px-4 text-sm font-medium text-white shadow-[var(--shadow-input)] " +
    "transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/40";

  const btnGhost =
    "rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 text-xs " +
    "text-[color:var(--color-foreground)] shadow-[var(--shadow-input)] transition hover:opacity-90 " +
    "focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/35 disabled:opacity-40";

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

  const filterSelect =
    "mt-1 h-7 w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] " +
    "px-2 text-[11px] text-[color:var(--color-foreground)] outline-none " +
    "focus:ring-2 focus:ring-[color:var(--color-accent)]/25";

  const pendingRowCls = isDark ? "bg-red-500/10" : "bg-rose-50";

  return (
    <section className={`${card} space-y-4`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className={`text-lg font-semibold ${fg}`}>BOQ Query</h2>
          <div className={`mt-1 text-xs ${muted}`}>
            • ค้นหา Description • เลือกแถวที่จะตัดออก (highlight) • กด Apply
            ทีเดียว
          </div>
        </div>

        <div className={`text-xs ${muted}`}>
          Page size: <span className={`${fg} font-medium`}>{PAGE_SIZE}</span>
        </div>
      </div>

      {/* Search input */}
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
              {/* pending actions */}
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

              <button
                type="button"
                onClick={resetTableFilters}
                className={btnGhost}
              >
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
                    WBS-1
                    <select
                      className={filterSelect}
                      value={tf.wbs1 ?? ""}
                      onChange={(e) => {
                        const v = e.target.value || null;
                        setTf((prev) => ({
                          ...prev,
                          wbs1: v,
                          wbs2: null,
                          wbs3: null,
                          wbs4: null,
                        }));
                        // keep page stable but clamp if needed
                        setPage((p) => Math.max(1, p));
                      }}
                    >
                      <option value="">All</option>
                      {wbs1Options.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </th>

                  <th className={th}>
                    WBS-2
                    <select
                      className={filterSelect}
                      value={tf.wbs2 ?? ""}
                      onChange={(e) => {
                        const v = e.target.value || null;
                        setTf((prev) => ({
                          ...prev,
                          wbs2: v,
                          wbs3: null,
                          wbs4: null,
                        }));
                      }}
                    >
                      <option value="">All</option>
                      {wbs2Options.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </th>

                  <th className={th}>
                    WBS-3
                    <select
                      className={filterSelect}
                      value={tf.wbs3 ?? ""}
                      onChange={(e) => {
                        const v = e.target.value || null;
                        setTf((prev) => ({ ...prev, wbs3: v, wbs4: null }));
                      }}
                    >
                      <option value="">All</option>
                      {wbs3Options.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </th>

                  <th className={th}>
                    WBS-4
                    <select
                      className={filterSelect}
                      value={tf.wbs4 ?? ""}
                      onChange={(e) => {
                        const v = e.target.value || null;
                        setTf((prev) => ({ ...prev, wbs4: v }));
                      }}
                    >
                      <option value="">All</option>
                      {wbs4Options.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </th>

                  <th className={th}>Description</th>
                  <th className={`${th} text-left`}>Unit</th>
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
                      <td className={td}>{r.unit}</td>
                      <td className={tdNum}>{(r.qty ?? 0).toLocaleString()}</td>
                      <td className={tdNum}>
                        {(r.material ?? 0).toLocaleString()}
                      </td>
                      <td className={tdNum}>
                        {(r.labor ?? 0).toLocaleString()}
                      </td>
                      <td className={`${tdNum} font-semibold`}>
                        {(r.amount ?? 0).toLocaleString()}
                      </td>

                      {/* staging toggle */}
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          className={
                            "h-7 w-7 rounded-lg border border-[color:var(--color-border)] " +
                            "bg-[color:var(--color-surface-2)] text-xs text-[color:var(--color-foreground)] " +
                            "hover:opacity-90"
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

              {/* Footer summary (applied state only) */}
              <tfoot>
                <tr className="border-t border-[color:var(--color-border)]">
                  <td className="p-3 text-xs" colSpan={6}>
                    <div className={`font-semibold ${fg}`}>Summary</div>
                    <div className={`mt-1 text-[11px] ${muted}`}>
                      Sum Qty (by Unit):{" "}
                      <span className={fg}>
                        {qtyByUnit.length
                          ? qtyByUnit
                              .map((x) => `${x.qty.toLocaleString()} ${x.unit}`)
                              .join("  |  ")
                          : "-"}
                      </span>
                    </div>
                    {pendingCountInFiltered > 0 ? (
                      <div className={`mt-1 text-[11px] ${muted}`}>
                        * มี{" "}
                        <span className={fg}>{pendingCountInFiltered}</span>{" "}
                        แถวที่เลือกไว้ (ยังไม่ถูกตัดออกจนกด Apply)
                      </div>
                    ) : null}
                  </td>

                  <td className="p-3 text-xs text-right" colSpan={4}>
                    <div className={`text-[11px] ${muted}`}>Sum Amount</div>
                    <div className={`text-sm font-semibold ${fg}`}>
                      {sumAmount.toLocaleString()}
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
