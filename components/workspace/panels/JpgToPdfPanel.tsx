"use client";

import { useState } from "react";
import type { WorkspaceFile } from "@/hooks/useWorkspace";
import type { PdfJob } from "@/lib/pdf/jobs";
import type { ImageInput } from "@/lib/pdf/imagesToPdf";

interface JpgToPdfPanelProps {
  files: WorkspaceFile[];
  runJob: (job: PdfJob) => Promise<{ filename: string; bytes: ArrayBuffer }>;
  onApply: (removeIds: string[], newFile: File) => void;
}

export function JpgToPdfPanel({ files, runJob, onApply }: JpgToPdfPanelProps) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setStatus("working");
    setError(null);
    try {
      const images: ImageInput[] = await Promise.all(
        files.map(async (wf) => ({
          bytes: await wf.file.arrayBuffer(),
          type: wf.file.type === "image/png" ? ("image/png" as const) : ("image/jpeg" as const),
        }))
      );
      const result = await runJob({ type: "imagesToPdf", images });
      onApply(
        files.map((wf) => wf.id),
        new File([result.bytes], result.filename, { type: "application/pdf" })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {files.length === 0
          ? "Check at least one JPG or PNG."
          : `Converting ${files.length} checked image${files.length === 1 ? "" : "s"} into one PDF, in this order.`}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleConvert}
        disabled={status === "working" || files.length === 0}
        className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-all duration-150 hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
      >
        {status === "working" ? "Working…" : "Convert to PDF"}
      </button>
    </div>
  );
}
