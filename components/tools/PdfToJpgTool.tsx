"use client";

import JSZip from "jszip";
import { ToolShell } from "@/components/ToolShell";
import { pdfToImages } from "@/lib/pdf/pdfToImages";
import { TOOLS } from "@/lib/tools";

export function PdfToJpgTool() {
  return (
    <ToolShell<Record<string, never>>
      title={TOOLS["pdf-to-jpg"].title}
      description={TOOLS["pdf-to-jpg"].description}
      accept="application/pdf"
      dropzoneLabel="Select a PDF file or drop it here"
      initialOptions={{}}
      processLabel="Convert to JPG"
      onProcess={async (files) => {
        const outputs = await pdfToImages(files[0], { scale: 2, quality: 0.85 });
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
