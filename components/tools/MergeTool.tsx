"use client";

import { ToolShell } from "@/components/ToolShell";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import { TOOLS } from "@/lib/tools";

export function MergeTool() {
  const { runJob } = usePdfWorker();

  return (
    <ToolShell<Record<string, never>>
      title={TOOLS["merge-pdf"].title}
      description={TOOLS["merge-pdf"].description}
      accept="application/pdf"
      multiple
      dropzoneLabel="Select PDF files or drop them here"
      dropzoneHint="Choose two or more files. Use the arrows below to set the merge order."
      initialOptions={{}}
      processLabel="Merge PDFs"
      onProcess={async (files) => {
        if (files.length < 2) {
          throw new Error("Select at least two PDF files to merge.");
        }
        const bytesList = await Promise.all(files.map((f) => f.arrayBuffer()));
        const result = await runJob({ type: "merge", bytesList });
        return { filename: result.filename, blob: new Blob([result.bytes], { type: "application/pdf" }) };
      }}
    />
  );
}
