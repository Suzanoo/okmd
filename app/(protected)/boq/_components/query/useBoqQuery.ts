"use client";

import { useCallback, useMemo, useState } from "react";
import type { BoqRow } from "@/lib/boq/types";
import {
  buildDescriptionRegex,
  filterByDescription,
  type MatchMode,
} from "@/lib/boq/query";

const DEFAULT_LIMIT = 200;

/** WorkingRow = row หลัง search + _id สำหรับ key/staging */
export type WorkingRow = BoqRow & { _id: string };

type Options = {
  /** default limit for initial render (Top N) */
  defaultLimit?: number;
};

/** สร้าง id แบบ deterministic (มี index กันชนกรณี row ซ้ำ) */
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

function amountGt0(r: BoqRow) {
  return (r.amount ?? 0) > 0;
}

export function useBoqQuery(rows: BoqRow[], opts?: Options) {
  const defaultLimit = opts?.defaultLimit ?? DEFAULT_LIMIT;

  // -------------------------
  // Draft UI state
  // -------------------------
  const [input, setInput] = useState("");
  const [matchMode, setMatchMode] = useState<MatchMode>("all");
  const [error, setError] = useState("");

  // pagination lives here (QuerySection uses it)
  const [page, setPage] = useState(1);

  // applied query (เมื่อ user กด Search)
  const [applied, setApplied] = useState<{ q: string; mode: MatchMode } | null>(
    null,
  );

  // apply removals (ลบจริงแล้ว) — เก็บเป็น ids
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());

  // staging pending remove (กด x)
  const [pendingRemoveIds, setPendingRemoveIds] = useState<Set<string>>(
    () => new Set(),
  );

  // highlight keywords (จาก draft input)
  const keywords = useMemo(
    () => input.trim().split(/\s+/).filter(Boolean),
    [input],
  );

  // -------------------------
  // Derived workingRows (NO setState in effect)
  // -------------------------
  const workingRows: WorkingRow[] = useMemo(() => {
    const base = rows.filter(amountGt0);

    // 1) initial view (ยังไม่กด Search) => Top N
    if (!applied || !applied.q.trim()) {
      return base
        .slice(0, defaultLimit)
        .map((r, i) => ({ ...r, _id: makeRowId(r, i) }))
        .filter((r) => !removedIds.has(r._id));
    }

    // 2) after Search
    const regex = buildDescriptionRegex(applied.q, applied.mode);
    if (!regex) return [];

    // note: filterByDescription robust/ปลอดภัยอยู่แล้ว (ถ้าแก้ r.description ?? "" ใน lib)
    const searched = filterByDescription(base, regex);

    return searched
      .map((r, i) => ({ ...r, _id: makeRowId(r, i) }))
      .filter((r) => !removedIds.has(r._id));
  }, [rows, applied, defaultLimit, removedIds]);

  // -------------------------
  // Actions
  // -------------------------
  const clearPending = useCallback(() => {
    setPendingRemoveIds(new Set());
  }, []);

  const togglePending = useCallback((id: string) => {
    setPendingRemoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /**
   * Search:
   * - reset error/page/pending
   * - set applied query (derived rows จะคำนวณเอง)
   * - ถ้า input ว่าง => ล้างผลลัพธ์ (คง behavior เดิม)
   */
  const onSearch = useCallback(() => {
    setError("");
    setPage(1);
    setPendingRemoveIds(new Set());

    const q = input.trim();
    if (!q) {
      setApplied(null); // กลับไป initial view (Top N)
      return;
    }

    // validate regex early เพื่อ set error ให้ user
    try {
      const r = buildDescriptionRegex(q, matchMode);
      if (!r) {
        setApplied(null);
        return;
      }
      setApplied({ q, mode: matchMode });
    } catch {
      setError("Invalid search pattern");
      setApplied(null);
    }
  }, [input, matchMode]);

  /**
   * Apply pending removals:
   * - add ids เข้า removedIds
   * - clear pending ids ที่ apply แล้ว
   * - clamp page ให้ caller ส่ง newTotalPages มา
   */
  const applyPendingRemovals = useCallback(
    (applyIds: Set<string>, newTotalPages: number) => {
      if (applyIds.size === 0) return;

      setPage((p) => Math.min(p, Math.max(1, newTotalPages)));

      setRemovedIds((prev) => {
        const next = new Set(prev);
        for (const id of applyIds) next.add(id);
        return next;
      });

      setPendingRemoveIds((prev) => {
        const next = new Set(prev);
        for (const id of applyIds) next.delete(id);
        return next;
      });
    },
    [],
  );

  return {
    // state
    input,
    setInput,
    matchMode,
    setMatchMode,
    error,

    workingRows,
    pendingRemoveIds,
    page,
    setPage,
    keywords,

    // actions
    onSearch,
    togglePending,
    clearPending,
    applyPendingRemovals,
  };
}
