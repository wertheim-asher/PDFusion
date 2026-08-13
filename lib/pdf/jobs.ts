import type { ProtectOptions } from "./protect";
import type { PageEdit } from "./organize";
import type { PageRange } from "./split";
import type { WatermarkOptions } from "./watermark";
import type { PageNumberOptions } from "./pageNumbers";
import type { ImageInput } from "./imagesToPdf";

export type PdfJob =
  | { type: "merge"; bytesList: ArrayBuffer[] }
  | { type: "imagesToPdf"; images: ImageInput[] }
  | { type: "split"; bytes: ArrayBuffer; ranges: PageRange[] }
  | { type: "organize"; bytes: ArrayBuffer; edits: PageEdit[] }
  | { type: "watermark"; bytes: ArrayBuffer; options: WatermarkOptions }
  | { type: "pageNumbers"; bytes: ArrayBuffer; options: PageNumberOptions }
  | { type: "protect"; bytes: ArrayBuffer; options: ProtectOptions }
  | { type: "unlock"; bytes: ArrayBuffer; password: string };

export type PdfJobRequest = PdfJob & { id: string };

export type PdfJobResult = { filename: string; bytes: ArrayBuffer };

export type PdfJobResponse =
  | ({ id: string; ok: true } & PdfJobResult)
  | { id: string; ok: false; error: string };
