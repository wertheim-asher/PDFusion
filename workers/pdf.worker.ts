import type { PdfJobRequest, PdfJobResponse, PdfJobResult } from "@/lib/pdf/jobs";
import { mergePdfs } from "@/lib/pdf/merge";
import { imagesToPdf } from "@/lib/pdf/imagesToPdf";
import { splitPdf } from "@/lib/pdf/split";
import { applyPageEdits } from "@/lib/pdf/organize";
import { addWatermark } from "@/lib/pdf/watermark";
import { addPageNumbers } from "@/lib/pdf/pageNumbers";
import { protectPdf } from "@/lib/pdf/protect";
import { unlockPdf } from "@/lib/pdf/unlock";
import { zipFiles } from "@/lib/pdf/zip";

async function runJob(job: PdfJobRequest): Promise<PdfJobResult> {
  switch (job.type) {
    case "merge": {
      const bytes = await mergePdfs(job.bytesList);
      return { filename: "merged.pdf", bytes: toArrayBuffer(bytes) };
    }
    case "imagesToPdf": {
      const bytes = await imagesToPdf(job.images);
      return { filename: "images.pdf", bytes: toArrayBuffer(bytes) };
    }
    case "split": {
      const outputs = await splitPdf(job.bytes, job.ranges);
      if (outputs.length === 1) {
        return { filename: outputs[0].filename, bytes: toArrayBuffer(outputs[0].bytes) };
      }
      const zipped = await zipFiles(outputs);
      return { filename: "split-pages.zip", bytes: toArrayBuffer(zipped) };
    }
    case "organize": {
      const bytes = await applyPageEdits(job.bytes, job.edits);
      return { filename: "organized.pdf", bytes: toArrayBuffer(bytes) };
    }
    case "watermark": {
      const bytes = await addWatermark(job.bytes, job.options);
      return { filename: "watermarked.pdf", bytes: toArrayBuffer(bytes) };
    }
    case "pageNumbers": {
      const bytes = await addPageNumbers(job.bytes, job.options);
      return { filename: "numbered.pdf", bytes: toArrayBuffer(bytes) };
    }
    case "protect": {
      const bytes = await protectPdf(new Uint8Array(job.bytes), job.options);
      return { filename: "protected.pdf", bytes: toArrayBuffer(bytes) };
    }
    case "unlock": {
      const bytes = await unlockPdf(new Uint8Array(job.bytes), job.password);
      return { filename: "unlocked.pdf", bytes: toArrayBuffer(bytes) };
    }
    default: {
      const exhaustiveCheck: never = job;
      throw new Error(`Unknown job type: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

self.onmessage = async (event: MessageEvent<PdfJobRequest>) => {
  const job = event.data;
  try {
    const { filename, bytes } = await runJob(job);
    const response: PdfJobResponse = { id: job.id, ok: true, filename, bytes };
    (self as unknown as Worker).postMessage(response, [bytes]);
  } catch (err) {
    const response: PdfJobResponse = {
      id: job.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as Worker).postMessage(response);
  }
};
