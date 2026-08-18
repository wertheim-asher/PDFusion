"use client";

import JSZip from "jszip";
import { DownloadPanel } from "./DownloadPanel";
import { pdfToImages } from "@/lib/pdf/pdfToImages";

export function PdfToJpgPanel({ file }: { file: File }) {
  return (
    <DownloadPanel
      applyLabel="Convert to JPG"
      run={async () => {
        const outputs = await pdfToImages(file, { scale: 2, quality: 0.85 });
        if (outputs.length === 1) {
          return { filename: outputs[0].filename, blob: outputs[0].blob };
        }
        const zip = new JSZip();
        for (const output of outputs) {
          zip.file(output.filename, output.blob);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        return { filename: "pages.zip", blob };
      }}
    />
  );
}
