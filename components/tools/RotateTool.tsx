"use client";

import { ToolShell } from "@/components/ToolShell";
import { PdfPageGrid } from "@/components/PdfPageGrid";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import type { PageEdit } from "@/lib/pdf/organize";
import { TOOLS } from "@/lib/tools";

interface Options {
  edits: PageEdit[];
}

export function RotateTool() {
  const { runJob } = usePdfWorker();

  return (
    <ToolShell<Options>
      title={TOOLS["rotate-pdf"].title}
      description={TOOLS["rotate-pdf"].description}
      accept="application/pdf"
      dropzoneLabel="Select a PDF file or drop it here"
      initialOptions={{ edits: [] }}
      processLabel="Save PDF"
      renderOptions={({ files, setOptions }) => (
        <PdfPageGrid
          file={files[0] ?? null}
          allowReorder={false}
          allowDelete={false}
          onChange={(edits) => setOptions({ edits })}
        />
      )}
      onProcess={async (files, options) => {
        const bytes = await files[0].arrayBuffer();
        const result = await runJob({ type: "organize", bytes, edits: options.edits });
        return { filename: "rotated.pdf", blob: new Blob([result.bytes], { type: "application/pdf" }) };
      }}
    />
  );
}
