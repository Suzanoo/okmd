"use client";

import { useMemo, useState } from "react";
import type { BoqRow } from "@/lib/boq/types";
import {
  buildDescriptionRegex,
  filterByDescription,
  toCSV,
} from "@/lib/boq/query";
import { highlightText } from "@/lib/boq/highlight";

const PAGE_SIZE = 20;

type Props = {
  rows: BoqRow[];
};

export default function QuerySection({ rows }: Props) {
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
  const totalPages = Math.ceil(result.length / PAGE_SIZE);
  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return result.slice(start, start + PAGE_SIZE);
  }, [result, page]);

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">BOQ Query</h2>

      {/* Search input */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ค้นหา Description (Thai / English)"
          className="h-10 flex-1 rounded-xl border px-3 text-sm"
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={matchMode === "any"}
            onChange={(e) => setMatchMode(e.target.checked ? "any" : "all")}
          />
          Match any word
        </label>
        <button
          onClick={onSearch}
          className="h-10 rounded-xl bg-sky-600 px-4 text-sm text-white hover:bg-sky-700"
        >
          Search
        </button>
      </div>

      <div className="text-xs text-muted-foreground">
        • รองรับคำไทย / อังกฤษ • พิมพ์หลายคำ
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {/* Result */}
      {result.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              พบ {result.length.toLocaleString()} รายการ
            </div>
            {/* <button
              onClick={onDownloadCSV}
              className="rounded-xl border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Download CSV
            </button> */}
          </div>

          {/* Table */}
          <div className="overflow-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-2 text-left">WBS-1</th>
                  <th className="p-2 text-left">WBS-2</th>
                  <th className="p-2 text-left">WBS-3</th>
                  <th className="p-2 text-left">WBS-4</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-right">Unit</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Material</th>
                  <th className="p-2 text-right">Labor</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{r.wbs1}</td>
                    <td className="p-2">{r.wbs2}</td>
                    <td className="p-2">{r.wbs3}</td>
                    <td className="p-2">{r.wbs4}</td>
                    <td className="p-2">
                      {highlightText(r.description, keywords)}
                    </td>
                    <td className="p-2 text-right">
                      {r.unit.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">{r.qty.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      {r.material.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      {r.labor.toLocaleString()}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {r.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs">
            <div>
              Page {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border px-2 py-1 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          {/* Dawnload Result */}
          <div className="flex items-center justify-end">
            <button
              onClick={onDownloadCSV}
              className="rounded-xl border px-3 py-1.5 text-xs hover:bg-muted bg-blue-500 text-white"
            >
              Download CSV
            </button>
          </div>
        </>
      ) : (
        <div className="text-sm text-muted-foreground">ยังไม่มีผลลัพธ์</div>
      )}
    </section>
  );
}
