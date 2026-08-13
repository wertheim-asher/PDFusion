import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number;
  rotationDegrees: number;
}

export async function addWatermark(fileBytes: ArrayBuffer, options: WatermarkOptions): Promise<Uint8Array> {
  if (!options.text.trim()) {
    throw new Error("Enter some watermark text.");
  }
  const doc = await PDFDocument.load(fileBytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(options.text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: options.fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: options.opacity,
      rotate: degrees(options.rotationDegrees),
    });
  }
  return doc.save();
}
