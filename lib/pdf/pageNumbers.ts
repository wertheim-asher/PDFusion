import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PageNumberPosition = "bottom-center" | "bottom-right" | "bottom-left";

export interface PageNumberOptions {
  startAt: number;
  position: PageNumberPosition;
  fontSize: number;
}

const MARGIN = 24;

export async function addPageNumbers(fileBytes: ArrayBuffer, options: PageNumberOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(fileBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  pages.forEach((page, i) => {
    const label = String(options.startAt + i);
    const { width } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, options.fontSize);
    let x: number;
    switch (options.position) {
      case "bottom-left":
        x = MARGIN;
        break;
      case "bottom-right":
        x = width - MARGIN - textWidth;
        break;
      case "bottom-center":
      default:
        x = width / 2 - textWidth / 2;
    }
    page.drawText(label, {
      x,
      y: MARGIN / 2,
      size: options.fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  });

  return doc.save();
}
