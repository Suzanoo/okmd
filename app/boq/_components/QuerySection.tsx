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

export default function QuerySection({ rows }: Props) {
  const isDark = useThemeStore((s) => s.theme) === "dark";

  const [input, setInput] = useState("");
  const [result, setResult] = useState<BoqRow[]>([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [matchMode, setMatchMode] = useState<"all" | "any">("all");

  const keywords = useMemo(
    () => input.trim().split(/\s+/).filter(Boolean),
    [input],
  );

  function onSearch() {
    setError("");
    setPage(1);

    const regex = buildDescriptionRegex(input, matchMode);
    if (!regex) {
      setResult([]);
      return;
    }

    try {
      const filtered = filterByDescription(rows, regex).filter(
        (r) => r.amount > 0,
      );
      setResult(filtered);
    } catch {
      setError("Invalid search pattern");
    }
  }

  function onDownloadCSV() {
    const csv = toCSV(result);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "boq_query_result.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  // ===== Pagination =====
  const totalPages = Math.max(1, Math.ceil(result.length / PAGE_SIZE));
  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return result.slice(start, start + PAGE_SIZE);
  }, [result, page]);

  // ===== Local UI tokens (theme-based) =====
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

  // Table styles (dark-friendly)
  const tableWrap =
    "overflow-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]";
  const thead =
    "sticky top-0 z-10 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]";
  const th = `p-2 text-left text-xs font-semibold ${muted}`;
  const td = `p-2 text-xs ${fg}`;
  const tdNum = `p-2 text-xs text-right ${fg}`;
  const row =
    "border-t border-[color:var(--color-border)] hover:bg-[color:var(--color-surface-2)]/70";

  // Hint / empty
  const emptyBox =
    "rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4 text-sm " +
    "text-[color:var(--color-muted-foreground)]";

  // Highlight style tweak (we keep highlightText but ensure mark looks good in dark)
  // NOTE: if your highlightText already handles dark via className, this still looks good.
  // If not, consider updating highlight.ts to use these mark classes:
  const highlightClass = isDark
    ? "rounded bg-amber-400/25 px-0.5 text-amber-200"
    : "rounded bg-yellow-200 px-0.5 text-slate-900";

  return (
    <section className={`${card} space-y-4`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className={`text-lg font-semibold ${fg}`}>BOQ Query</h2>
          <div className={`mt-1 text-xs ${muted}`}>
            • รองรับคำไทย / อังกฤษ • พิมพ์หลายคำ • เลือก match ได้
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
      {result.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <div className={`text-sm ${muted}`}>
              พบ{" "}
              <span className={`${fg} font-medium`}>
                {result.length.toLocaleString()}
              </span>{" "}
              รายการ
            </div>

            <div className="flex items-center gap-2">
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
            <table className="w-full min-w-[980px] text-xs">
              <thead className={thead}>
                <tr>
                  <th className={th}>WBS-1</th>
                  <th className={th}>WBS-2</th>
                  <th className={th}>WBS-3</th>
                  <th className={th}>WBS-4</th>
                  <th className={th}>Description</th>
                  <th className={`${th} text-right`}>Unit</th>
                  <th className={`${th} text-right`}>Qty</th>
                  <th className={`${th} text-right`}>Material</th>
                  <th className={`${th} text-right`}>Labor</th>
                  <th className={`${th} text-right`}>Amount</th>
                </tr>
              </thead>

              <tbody>
                {pageData.map((r, i) => (
                  <tr key={i} className={row}>
                    <td className={td}>{r.wbs1}</td>
                    <td className={td}>{r.wbs2}</td>
                    <td className={td}>{r.wbs3}</td>
                    <td className={td}>{r.wbs4}</td>
                    <td className={td}>
                      {/* highlightText returns ReactNode.
                          We pass keywords; plus we provide a safer fallback class via wrapper */}
                      <span className="[&>mark]:rounded [&>mark]:px-0.5">
                        {/* If your highlightText already applies classes, it's fine.
                            If not, it still inherits mark rounding/padding here. */}
                        {highlightText(r.description, keywords)}
                      </span>
                    </td>
                    <td className={tdNum}>{r.unit.toLocaleString()}</td>
                    <td className={tdNum}>{r.qty.toLocaleString()}</td>
                    <td className={tdNum}>{r.material.toLocaleString()}</td>
                    <td className={tdNum}>{r.labor.toLocaleString()}</td>
                    <td className={`${tdNum} font-semibold`}>
                      {r.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
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
