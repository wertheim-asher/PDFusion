"use client";

import { useState } from "react";
import type { WorkspaceFile } from "@/hooks/useWorkspace";
import type { PdfJob } from "@/lib/pdf/jobs";

interface MergePanelProps {
  files: WorkspaceFile[];
  runJob: (job: PdfJob) => Promise<{ filename: string; bytes: ArrayBuffer }>;
  onApply: (removeIds: string[], newFile: File) => void;
}

export function MergePanel({ files, runJob, onApply }: MergePanelProps) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleMerge = async () => {
    setStatus("working");
    setError(null);
    try {
      const bytesList = await Promise.all(files.map((wf) => wf.file.arrayBuffer()));
      const result = await runJob({ type: "merge", bytesList });
      onApply(
        files.map((wf) => wf.id),
        new File([result.bytes], result.filename, { type: "application/pdf" })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  const needsMore = files.length < 2;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {needsMore ? "Check at least two PDFs to merge them." : `Merging ${files.length} checked PDFs in this order.`}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleMerge}
        disabled={status === "working" || needsMore}
        className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-all duration-150 hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
      >
        {status === "working" ? "Working…" : "Merge PDFs"}
      </button>
    </div>
  );
}
