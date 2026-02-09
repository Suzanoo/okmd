import type { jsPDF } from "jspdf";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function registerThaiFont(doc: jsPDF) {
  const [regBuf, boldBuf] = await Promise.all([
    fetch("/fonts/Sarabun-Regular.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/Sarabun-Bold.ttf").then((r) => r.arrayBuffer()),
  ]);

  const regBase64 = arrayBufferToBase64(regBuf);
  const boldBase64 = arrayBufferToBase64(boldBuf);

  doc.addFileToVFS("Sarabun-Regular.ttf", regBase64);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");

  doc.addFileToVFS("Sarabun-Bold.ttf", boldBase64);
  doc.addFont("Sarabun-Bold.ttf", "Sarabun", "bold");

  doc.setFont("Sarabun", "normal");
}
