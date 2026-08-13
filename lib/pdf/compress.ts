import { PDFDocument } from "pdf-lib";

export type CompressLevel = "low" | "medium" | "high";

const PRESETS: Record<CompressLevel, { scale: number; quality: number }> = {
  low: { scale: 1.0, quality: 0.4 },
  medium: { scale: 1.5, quality: 0.65 },
  high: { scale: 2.0, quality: 0.8 },
};

/**
 * Rasterizes each page to a JPEG at the chosen quality and rebuilds the PDF
 * from those images. Runs on the main thread (not pdf.worker.ts) because it
 * needs a real <canvas> — see PdfPageGrid for the same pattern and why
 * `intent: "print"` is required.
 */
export async function compressPdf(file: File, level: CompressLevel): Promise<Uint8Array> {
  const { scale, quality } = PRESETS[level];
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buf = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buf });
  const src = await loadingTask.promise;
  try {
    const out = await PDFDocument.create();
    for (let i = 1; i <= src.numPages; i++) {
      const page = await src.getPage(i);
      const pointSize = page.getViewport({ scale: 1 });
      const pixelViewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = pixelViewport.width;
      canvas.height = pixelViewport.height;
      await page.render({ canvas, viewport: pixelViewport, intent: "print" }).promise;
      const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
      const jpegBytes = dataUrlToBytes(jpegDataUrl);
      const embedded = await out.embedJpg(jpegBytes);
      const outPage = out.addPage([pointSize.width, pointSize.height]);
      outPage.drawImage(embedded, { x: 0, y: 0, width: pointSize.width, height: pointSize.height });
    }
    return out.save();
  } finally {
    loadingTask.destroy();
  }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
