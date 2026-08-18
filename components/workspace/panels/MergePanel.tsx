"use client";

import { useState } from "react";
import type { PdfJob } from "@/lib/pdf/jobs";

interface MergePanelProps {
  files: File[];
  runJob: (job: PdfJob) => Promise<{ filename: string; bytes: ArrayBuffer }>;
  onApply: (file: File) => void;
}

export function MergePanel({ files, runJob, onApply }: MergePanelProps) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleMerge = async () => {
    setStatus("working");
    setError(null);
    try {
      const bytesList = await Promise.all(files.map((f) => f.arrayBuffer()));
      const result = await runJob({ type: "merge", bytesList });
      onApply(new File([result.bytes], result.filename, { type: "application/pdf" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  const needsMore = files.length < 2;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {needsMore ? "Add at least one more PDF above to merge." : `Merging ${files.length} PDFs in this order.`}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleMerge}
        disabled={status === "working" || needsMore}
        className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
      >
        {status === "working" ? "Working…" : "Merge PDFs"}
      </button>
    </div>
  );
}
