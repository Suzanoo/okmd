// lib/excel/readWorkbook.ts
export type XlsxModule = typeof import("xlsx");

export async function loadXlsxModule(): Promise<XlsxModule> {
  // dynamic import => ลด initial bundle
  return await import("xlsx");
}

export async function readWorkbookFromArrayBuffer(
  data: ArrayBuffer
): Promise<import("xlsx").WorkBook> {
  const XLSX = await loadXlsxModule();
  return XLSX.read(data, { type: "array" });
}
