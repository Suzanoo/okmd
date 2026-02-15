"use client";

import type React from "react";
import type { BoqRow } from "@/lib/boq/types";
import { highlightText } from "@/lib/boq/highlight";

import MultiSelectDropdown from "../controls/MultiSelectDropdown";

type WorkingRow = BoqRow & { _id: string };

type TableFilters = {
  wbs1: string[];
  wbs2: string[];
  wbs3: string[];
  wbs4: string[];
  unit: string[];
};

type QtyByUnit = { unit: string; qty: number };

type Props = {
  // data
  pageData: WorkingRow[];
  qtyByUnit: QtyByUnit[];
  sumAmount: number;

  // paging
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;

  // pending remove
  pendingRemoveIds: Set<string>;
  togglePending: (id: string) => void;

  // highlight
  keywords: string[];

  // header filters
  tf: TableFilters;
  patchFilters: (patch: Partial<TableFilters>) => void;

  // dropdown options
  wbs1Options: string[];
  wbs2Options: string[];
  wbs3Options: string[];
  wbs4Options: string[];
  unitOptions: string[];

  // helpers
  normalizeUnit: (u: string | null | undefined) => string;
  safeNum: (v: number | null | undefined) => number;
  fmtInt: (n: number) => string;
  fmtNum: (n: number) => string;

  // UI tokens (tailwind strings)
  tableWrap: string;
  thead: string;
  th: string;
  td: string;
  tdNum: string;
  rowBase: string;
  muted: string;
  fg: string;
  markWrap: string;
  pendingRowCls: string;
  btnGhost: string;
};

export default function QueryTable({
  pageData,
  qtyByUnit,
  sumAmount,

  page,
  totalPages,
  setPage,

  pendingRemoveIds,
  togglePending,

  keywords,

  tf,
  patchFilters,

  wbs1Options,
  wbs2Options,
  wbs3Options,
  wbs4Options,
  unitOptions,

  normalizeUnit,
  safeNum,
  fmtInt,
  fmtNum,

  tableWrap,
  thead,
  th,
  td,
  tdNum,
  rowBase,
  muted,
  fg,
  markWrap,
  pendingRowCls,
  btnGhost,
}: Props) {
  return (
    <>
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
                  onChange={(next) => patchFilters({ wbs3: next, wbs4: [] })}
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
                      aria-label={pending ? "Undo remove" : "Mark to remove"}
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
  );
}
