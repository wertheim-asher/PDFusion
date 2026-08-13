"use client";

import { ToolShell } from "@/components/ToolShell";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import type { ImageInput } from "@/lib/pdf/imagesToPdf";
import { TOOLS } from "@/lib/tools";

export function JpgToPdfTool() {
  const { runJob } = usePdfWorker();

  return (
    <ToolShell<Record<string, never>>
      title={TOOLS["jpg-to-pdf"].title}
      description={TOOLS["jpg-to-pdf"].description}
      accept="image/jpeg,image/png"
      multiple
      dropzoneLabel="Select images or drop them here"
      dropzoneHint="JPG or PNG. Use the arrows below to set the page order."
      initialOptions={{}}
      processLabel="Convert to PDF"
      onProcess={async (files) => {
        const images: ImageInput[] = await Promise.all(
          files.map(async (f) => ({
            bytes: await f.arrayBuffer(),
            type: f.type === "image/png" ? ("image/png" as const) : ("image/jpeg" as const),
          }))
        );
        const result = await runJob({ type: "imagesToPdf", images });
        return { filename: result.filename, blob: new Blob([result.bytes], { type: "application/pdf" }) };
      }}
    />
  );
}
