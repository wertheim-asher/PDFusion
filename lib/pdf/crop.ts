import { PDFDocument } from "pdf-lib";

export interface CropOptions {
  /** Margins to trim from each edge, in points (72pt = 1in). */
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export async function cropPdf(fileBytes: ArrayBuffer, options: CropOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(fileBytes);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const left = options.left;
    const bottom = options.bottom;
    const right = width - options.right;
    const top = height - options.top;
    if (right <= left || top <= bottom) {
      throw new Error("Those margins would crop a page down to nothing — use smaller values.");
    }
    page.setCropBox(left, bottom, right - left, top - bottom);
  }
  return doc.save();
}
