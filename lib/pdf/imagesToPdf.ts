import { PDFDocument } from "pdf-lib";

export interface ImageInput {
  bytes: ArrayBuffer;
  type: "image/jpeg" | "image/png";
}

export async function imagesToPdf(images: ImageInput[]): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error("Select at least one image.");
  }
  const doc = await PDFDocument.create();
  for (const image of images) {
    const embedded = image.type === "image/png" ? await doc.embedPng(image.bytes) : await doc.embedJpg(image.bytes);
    const page = doc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  }
  return doc.save();
}
