"use client";

import { useEffect, useMemo, useState } from "react";
import type { BoqBuilding, BoqRow } from "@/lib/boq/types";
import {
  fetchWorkbookBuffer,
  getValidSheetsFromBuffer,
  parseBoqRowsFromBuffer,
} from "@/lib/boq/boqParse";
import { filterRows, sumBy } from "@/lib/boq/boqTransform";

import BuildingFilePicker from "./controls/BuildingFilePicker";
import SheetPicker from "./controls/SheetPicker";

import PieAmountCard from "./cards/PieAmountCard";
import BarAmountCard from "./cards/BarAmountCard";
import WBSSelect from "./controls/WBSSelect";

import QuerySection from "./QuerySection";

function boqPath(building: BoqBuilding) {
  return `/boq/BOQ_${building}.xlsx`;
}

export default function BOQClient() {
  const [building, setBuilding] = useState<BoqBuilding>("NKC1");

  // workbook buffer + sheets
  const [buf, setBuf] = useState<ArrayBuffer | null>(null);
  const [validSheets, setValidSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");

  // parsed rows
  const [rows, setRows] = useState<BoqRow[]>([]);

  // cascade selection (dropdown-driven)
  const [wbs1, setWbs1] = useState<string | null>(null);
  const [wbs2, setWbs2] = useState<string | null>(null);
  const [wbs3, setWbs3] = useState<string | null>(null);
  const [wbs4, setWbs4] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ===== Load workbook when building changes =====
  useEffect(() => {
    async function loadWorkbook() {
      setIsLoading(true);
      setErrorMsg("");

      setBuf(null);
      setRows([]);
      setValidSheets([]);
      setSelectedSheet("");

      // reset cascade
      setWbs1(null);
      setWbs2(null);
      setWbs3(null);
      setWbs4(null);

      try {
        const b = await fetchWorkbookBuffer(boqPath(building));
        const sheets = getValidSheetsFromBuffer(b);

        setBuf(b);
        setValidSheets(sheets);
        setSelectedSheet(sheets[0] ?? "");

        if (sheets.length === 0) {
          setErrorMsg("ไม่พบ sheet ที่มี columns ครบตามที่กำหนด");
        }
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkbook();
  }, [building]);

  // ===== Parse rows when sheet changes =====
  useEffect(() => {
    if (!buf || !selectedSheet) return;

    setIsLoading(true);
    setErrorMsg("");

    // reset cascade (sheet changed)
    setWbs1(null);
    setWbs2(null);
    setWbs3(null);
    setWbs4(null);

    try {
      const r = parseBoqRowsFromBuffer(buf, selectedSheet);
      setRows(r);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Parse error");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [buf, selectedSheet]);

  // ===== Derived rowsets =====
  const rowsWBS1 = useMemo(() => rows, [rows]);
  const rowsWBS2 = useMemo(() => filterRows(rows, { wbs1 }), [rows, wbs1]);
  const rowsWBS3 = useMemo(
    () => filterRows(rows, { wbs1, wbs2 }),
    [rows, wbs1, wbs2],
  );
  const rowsWBS4 = useMemo(
    () => filterRows(rows, { wbs1, wbs2, wbs3 }),
    [rows, wbs1, wbs2, wbs3],
  );
  const rowsDesc = useMemo(
    () => filterRows(rows, { wbs1, wbs2, wbs3, wbs4 }),
    [rows, wbs1, wbs2, wbs3, wbs4],
  );

  // ===== Chart data (lazy rendering) =====
  const pieWBS1 = useMemo(() => sumBy(rowsWBS1, (r) => r.wbs1), [rowsWBS1]);

  const barWBS2 = useMemo(() => {
    if (!wbs1) return [];
    return sumBy(rowsWBS2, (r) => r.wbs2);
  }, [rowsWBS2, wbs1]);

  const barWBS3 = useMemo(() => {
    if (!wbs1 || !wbs2) return [];
    return sumBy(rowsWBS3, (r) => r.wbs3);
  }, [rowsWBS3, wbs1, wbs2]);

  const barWBS4 = useMemo(() => {
    if (!wbs1 || !wbs2 || !wbs3) return [];
    return sumBy(rowsWBS4, (r) => r.wbs4);
  }, [rowsWBS4, wbs1, wbs2, wbs3]);

  const barDesc = useMemo(() => {
    if (!wbs1 || !wbs2 || !wbs3 || !wbs4) return [];
    return sumBy(rowsDesc, (r) => r.description);
  }, [rowsDesc, wbs1, wbs2, wbs3, wbs4]);

  // ===== Options for dropdowns =====
  const wbs1Options = useMemo(() => pieWBS1.map((d) => d.name), [pieWBS1]);
  const wbs2Options = useMemo(() => barWBS2.map((d) => d.name), [barWBS2]);
  const wbs3Options = useMemo(() => barWBS3.map((d) => d.name), [barWBS3]);
  const wbs4Options = useMemo(() => barWBS4.map((d) => d.name), [barWBS4]);

  // ===== Cascading setters (dropdown-driven) =====
  const setWBS1 = (v: string | null) => {
    setWbs1(v);
    setWbs2(null);
    setWbs3(null);
    setWbs4(null);
  };
  const setWBS2 = (v: string | null) => {
    setWbs2(v);
    setWbs3(null);
    setWbs4(null);
  };
  const setWBS3 = (v: string | null) => {
    setWbs3(v);
    setWbs4(null);
  };
  const setWBS4 = (v: string | null) => {
    setWbs4(v);
  };

  // ===== Modern bar colors =====
  const C_WBS2 = "hsl(217 91% 60%)"; // blue
  const C_WBS3 = "hsl(160 84% 39%)"; // teal/green
  const C_WBS4 = "hsl(262 83% 58%)"; // purple
  const C_DESC = "hsl(25 95% 53%)"; // orange

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <header className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                OKMD • Construction Management
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                BOQ Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Budget structure overview → drill down by WBS
              </p>
            </div>

            <div className="text-xs text-slate-500">
              Building:{" "}
              <span className="font-medium text-slate-800">{building}</span>
              {selectedSheet ? (
                <>
                  {" "}
                  • Sheet:{" "}
                  <span className="font-medium text-slate-800">
                    {selectedSheet}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </header>

        {/* Source controls */}
        <div className="grid gap-4 lg:grid-cols-2">
          <BuildingFilePicker building={building} onChange={setBuilding} />

          <SheetPicker
            sheets={validSheets}
            value={selectedSheet}
            onChange={setSelectedSheet}
            disabled={isLoading || validSheets.length === 0}
          />
        </div>

        {isLoading ? (
          <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
            Loading BOQ… <span className="font-mono">{boqPath(building)}</span>
          </div>
        ) : null}

        {errorMsg ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        {/* Current filter */}
        <div className="rounded-2xl border bg-background/50 p-4 text-sm">
          <div className="text-xs text-muted-foreground">Current filter</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full border px-3 py-1 text-xs">
              WBS-1: {wbs1 ?? "All"}
            </span>
            <span className="rounded-full border px-3 py-1 text-xs">
              WBS-2: {wbs2 ?? "All"}
            </span>
            <span className="rounded-full border px-3 py-1 text-xs">
              WBS-3: {wbs3 ?? "All"}
            </span>
            <span className="rounded-full border px-3 py-1 text-xs">
              WBS-4: {wbs4 ?? "All"}
            </span>

            <button
              type="button"
              onClick={() => {
                setWbs1(null);
                setWbs2(null);
                setWbs3(null);
                setWbs4(null);
              }}
              className="ml-auto rounded-full border px-3 py-1 text-xs hover:bg-muted"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* ===== Row 1 ===== */}
        <div className="grid gap-4 lg:grid-cols-2">
          <PieAmountCard
            title="WBS-1 Amount"
            subtitle="Overview by WBS-1 (optional click)"
            data={pieWBS1}
            selected={wbs1}
            onSelect={(name) => setWBS1(name)} // click slice works
            onClear={() => setWBS1(null)}
          />

          <BarAmountCard
            title="WBS-2 Amount"
            subtitle={
              wbs1 ? `Filtered by WBS-1 = ${wbs1}` : "Select WBS-1 to render"
            }
            data={barWBS2}
            color={C_WBS2}
            disabled={!wbs1}
            disabledHint="เลือก WBS-1 ก่อน เพื่อแสดง Bar ของ WBS-2"
            topControl={
              <WBSSelect
                label="WBS-1"
                value={wbs1}
                options={wbs1Options}
                placeholder="(Choose WBS-1)"
                onChange={setWBS1}
                disabled={isLoading || wbs1Options.length === 0}
              />
            }
            onSelect={(name) => setWBS2(name)}
          />
        </div>

        {/* ===== Row 2 ===== */}
        <div className="grid gap-4 lg:grid-cols-2">
          <BarAmountCard
            title="WBS-3 Amount"
            subtitle={
              wbs2 ? `Filtered by WBS-2 = ${wbs2}` : "Select WBS-2 to render"
            }
            data={barWBS3}
            color={C_WBS3}
            disabled={!wbs1 || !wbs2}
            disabledHint="เลือก WBS-1 และ WBS-2 ก่อน เพื่อแสดง Bar ของ WBS-3"
            topControl={
              <WBSSelect
                label="WBS-2"
                value={wbs2}
                options={wbs2Options}
                placeholder="(Choose WBS-2)"
                onChange={setWBS2}
                disabled={!wbs1 || isLoading || wbs2Options.length === 0}
              />
            }
            onSelect={(name) => setWBS3(name)}
          />

          <BarAmountCard
            title="WBS-4 Amount"
            subtitle={
              wbs3 ? `Filtered by WBS-3 = ${wbs3}` : "Select WBS-3 to render"
            }
            data={barWBS4}
            color={C_WBS4}
            disabled={!wbs1 || !wbs2 || !wbs3}
            disabledHint="เลือก WBS-1, WBS-2, WBS-3 ก่อน เพื่อแสดง Bar ของ WBS-4"
            topControl={
              <WBSSelect
                label="WBS-3"
                value={wbs3}
                options={wbs3Options}
                placeholder="(Choose WBS-3)"
                onChange={setWBS3}
                disabled={!wbs2 || isLoading || wbs3Options.length === 0}
              />
            }
            onSelect={(name) => setWBS4(name)}
          />
        </div>

        {/* ===== Row 3 ===== */}
        <section className="rounded-3xl border border-slate-200 bg-slate-100/60 p-4">
          <div className="grid gap-4">
            <BarAmountCard
              title="Description Amount"
              subtitle="Final level (render only when WBS-1..4 selected)"
              data={barDesc}
              color={C_DESC}
              height={300}
              disabled={!wbs1 || !wbs2 || !wbs3 || !wbs4}
              disabledHint="เลือก WBS-1 → WBS-2 → WBS-3 → WBS-4 ก่อน เพื่อแสดง Description"
              topControl={
                <WBSSelect
                  label="WBS-4"
                  value={wbs4}
                  options={wbs4Options}
                  placeholder="(Choose WBS-4)"
                  onChange={setWBS4}
                  disabled={!wbs3 || isLoading || wbs4Options.length === 0}
                />
              }
            />
          </div>
        </section>

        {/* ===== Query Section ===== */}
        <QuerySection rows={rows} />
      </div>
    </div>
  );
}
