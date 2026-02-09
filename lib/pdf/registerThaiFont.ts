import type { jsPDF } from "jspdf";

let cached: null | { reg: string; bold: string } = null;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function loadFontsOnce() {
  if (cached) return cached;

  const [regBuf, boldBuf] = await Promise.all([
    fetch("/fonts/Sarabun-Regular.ttf", { cache: "force-cache" }).then((r) => r.arrayBuffer()),
    fetch("/fonts/Sarabun-Bold.ttf", { cache: "force-cache" }).then((r) => r.arrayBuffer()),
  ]);

  cached = {
    reg: arrayBufferToBase64(regBuf),
    bold: arrayBufferToBase64(boldBuf),
  };
  return cached;
}

/** Register Thai fonts into the given jsPDF doc (cached load). */
export async function registerThaiFont(doc: jsPDF) {
  const { reg, bold } = await loadFontsOnce();

  doc.addFileToVFS("Sarabun-Regular.ttf", reg);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");

  doc.addFileToVFS("Sarabun-Bold.ttf", bold);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");

  doc.setFont("Sarabun", "normal");
}
