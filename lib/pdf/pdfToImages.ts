export interface PdfToImagesOptions {
  scale: number;
  quality: number;
}

export interface ImageOutput {
  filename: string;
  blob: Blob;
}

/**
 * Renders each page of a PDF to a JPEG image. Runs on the main thread (not
 * the pdf.worker.ts Web Worker) because it needs a real <canvas> element —
 * see PdfPageGrid for the same pattern and why `intent: "print"` is required.
 */
export async function pdfToImages(file: File, options: PdfToImagesOptions): Promise<ImageOutput[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buf = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buf });
  const pdf = await loadingTask.promise;
  try {
    const outputs: ImageOutput[] = [];
    const digits = String(pdf.numPages).length;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: options.scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport, intent: "print" }).promise;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", options.quality)
      );
      if (!blob) {
        throw new Error(`Failed to render page ${i} to an image.`);
      }
      outputs.push({ filename: `page-${String(i).padStart(digits, "0")}.jpg`, blob });
    }
    return outputs;
  } finally {
    loadingTask.destroy();
  }
}
