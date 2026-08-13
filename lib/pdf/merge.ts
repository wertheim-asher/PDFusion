import { PDFDocument } from "pdf-lib";

export async function mergePdfs(files: ArrayBuffer[]): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new Error("Select at least two PDF files to merge.");
  }
  const merged = await PDFDocument.create();
  for (const fileBytes of files) {
    const src = await PDFDocument.load(fileBytes);
    const pages = await merged.copyPages(src, src.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }
  return merged.save();
}
