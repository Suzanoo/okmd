// lib/report/time.ts
export type ISODateKey = `${number}-${string}-${string}`; // "YYYY-MM-DD"

/** true if string is ISO date: YYYY-MM-DD */
export function isISODateKey(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.trim());
}

export function toISODateString(d: Date): string {
  // force UTC-like yyyy-mm-dd from local Date
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseISODate(s: string): Date | null {
  if (!isISODateKey(s)) return null;
  // Create date in local time safely
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  // Validate round-trip
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function sortISODateKeys(dates: string[]): string[] {
  return [...dates].sort((a, b) => {
    const da = parseISODate(a);
    const db = parseISODate(b);
    if (!da || !db) return a.localeCompare(b);
    return da.getTime() - db.getTime();
  });
}

/**
 * cutoff = last date where actual > 0
 */
export function detectCutoffDate(points: { date: string; actual: number | null }[]): string | null {
  let cutoff: string | null = null;
  for (const p of points) {
    if (p.actual != null && p.actual > 0) cutoff = p.date;
  }
  return cutoff;
}

/** Compare ISO dates (YYYY-MM-DD). Returns -1/0/1 */
export function compareISODate(a: string, b: string): number {
  const da = parseISODate(a);
  const db = parseISODate(b);
  if (!da || !db) return a.localeCompare(b);
  const ta = da.getTime();
  const tb = db.getTime();
  return ta === tb ? 0 : ta < tb ? -1 : 1;
}

/** YYYY-MM from ISO date */
export function monthKeyFromISODate(date: string): string {
  // assumes valid ISO
  return date.slice(0, 7);
}