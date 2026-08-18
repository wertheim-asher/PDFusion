"use client";

import { useState } from "react";
import type { PdfJob } from "@/lib/pdf/jobs";
import type { ImageInput } from "@/lib/pdf/imagesToPdf";

interface JpgToPdfPanelProps {
  files: File[];
  runJob: (job: PdfJob) => Promise<{ filename: string; bytes: ArrayBuffer }>;
  onApply: (file: File) => void;
}

export function JpgToPdfPanel({ files, runJob, onApply }: JpgToPdfPanelProps) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setStatus("working");
    setError(null);
    try {
      const images: ImageInput[] = await Promise.all(
        files.map(async (f) => ({
          bytes: await f.arrayBuffer(),
          type: f.type === "image/png" ? ("image/png" as const) : ("image/jpeg" as const),
        }))
      );
      const result = await runJob({ type: "imagesToPdf", images });
      onApply(new File([result.bytes], result.filename, { type: "application/pdf" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {files.length === 0 ? "Add JPG or PNG images above." : `Converting ${files.length} image${files.length === 1 ? "" : "s"} into one PDF, in this order.`}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleConvert}
        disabled={status === "working" || files.length === 0}
        className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
      >
        {status === "working" ? "Working…" : "Convert to PDF"}
      </button>
    </div>
  );
}
