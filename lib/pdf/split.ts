import { PDFDocument } from "pdf-lib";

export interface PageRange {
  from: number;
  to: number;
}

export interface SplitOutput {
  filename: string;
  bytes: Uint8Array;
}

export function parseRanges(input: string, pageCount: number): PageRange[] {
  const ranges: PageRange[] = [];
  for (const part of input.split(",").map((s) => s.trim()).filter(Boolean)) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) {
      throw new Error(`Invalid page range: "${part}"`);
    }
    const from = parseInt(match[1], 10);
    const to = match[2] ? parseInt(match[2], 10) : from;
    if (from < 1 || to > pageCount || from > to) {
      throw new Error(`Page range "${part}" is out of bounds for a ${pageCount}-page document.`);
    }
    ranges.push({ from, to });
  }
  if (ranges.length === 0) {
    throw new Error("Enter at least one page range, e.g. 1-3, 5.");
  }
  return ranges;
}

export async function splitPdf(fileBytes: ArrayBuffer, ranges: PageRange[]): Promise<SplitOutput[]> {
  const src = await PDFDocument.load(fileBytes);
  const outputs: SplitOutput[] = [];
  for (const range of ranges) {
    const out = await PDFDocument.create();
    const indices = [];
    for (let p = range.from; p <= range.to; p++) indices.push(p - 1);
    const pages = await out.copyPages(src, indices);
    for (const page of pages) out.addPage(page);
    const bytes = await out.save();
    const label = range.from === range.to ? `page-${range.from}` : `pages-${range.from}-${range.to}`;
    outputs.push({ filename: `${label}.pdf`, bytes });
  }
  return outputs;
}
