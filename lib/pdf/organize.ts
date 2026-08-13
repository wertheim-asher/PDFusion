import { PDFDocument, degrees } from "pdf-lib";

export interface PageEdit {
  /** 0-indexed page number in the source document. */
  originalIndex: number;
  /** Additional rotation to apply, in degrees (0, 90, 180, 270). */
  rotateBy: number;
}

/**
 * Rebuilds a PDF from a list of page edits. The order of `edits` is the
 * output order; pages omitted from `edits` are dropped. Shared by the
 * Organize (reorder/delete) and Rotate tools.
 */
export async function applyPageEdits(fileBytes: ArrayBuffer, edits: PageEdit[]): Promise<Uint8Array> {
  if (edits.length === 0) {
    throw new Error("The document must have at least one page left.");
  }
  const src = await PDFDocument.load(fileBytes);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(
    src,
    edits.map((e) => e.originalIndex)
  );
  pages.forEach((page, i) => {
    const rotateBy = edits[i].rotateBy % 360;
    if (rotateBy !== 0) {
      page.setRotation(degrees((page.getRotation().angle + rotateBy) % 360));
    }
    out.addPage(page);
  });
  return out.save();
}
