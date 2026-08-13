"use client";

import { ToolShell } from "@/components/ToolShell";
import { PdfPageGrid } from "@/components/PdfPageGrid";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import type { PageEdit } from "@/lib/pdf/organize";
import { TOOLS } from "@/lib/tools";

interface Options {
  edits: PageEdit[];
}

export function OrganizeTool() {
  const { runJob } = usePdfWorker();

  return (
    <ToolShell<Options>
      title={TOOLS["organize-pdf"].title}
      description={TOOLS["organize-pdf"].description}
      accept="application/pdf"
      dropzoneLabel="Select a PDF file or drop it here"
      initialOptions={{ edits: [] }}
      processLabel="Save PDF"
      renderOptions={({ files, setOptions }) => (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Drag to reorder. Click ✕ to delete a page, ⟳ to rotate it.</p>
          <PdfPageGrid file={files[0] ?? null} onChange={(edits) => setOptions({ edits })} />
        </div>
      )}
      onProcess={async (files, options) => {
        const bytes = await files[0].arrayBuffer();
        const result = await runJob({ type: "organize", bytes, edits: options.edits });
        return { filename: result.filename, blob: new Blob([result.bytes], { type: "application/pdf" }) };
      }}
    />
  );
}
