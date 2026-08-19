"use client";

import JSZip from "jszip";
import { DownloadPanel } from "./DownloadPanel";
import { pdfToImages } from "@/lib/pdf/pdfToImages";
import type { WorkspaceFile } from "@/hooks/useWorkspace";

export function PdfToJpgPanel({ files }: { files: WorkspaceFile[] }) {
  return (
    <DownloadPanel
      applyLabel="Convert to JPG"
      run={async () => {
        const perFile = await Promise.all(
          files.map(async (wf) => {
            const outputs = await pdfToImages(wf.file, { scale: 2, quality: 0.85 });
            const prefix = wf.file.name.replace(/\.pdf$/i, "");
            return outputs.map((o) => ({ ...o, filename: files.length > 1 ? `${prefix}-${o.filename}` : o.filename }));
          })
        );
        const all = perFile.flat();
        if (all.length === 1) {
          return { filename: all[0].filename, blob: all[0].blob };
        }
        const zip = new JSZip();
        for (const output of all) {
          zip.file(output.filename, output.blob);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        return { filename: "pages.zip", blob };
      }}
    />
  );
}
