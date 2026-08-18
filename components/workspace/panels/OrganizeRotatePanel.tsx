"use client";

import { useState } from "react";
import type { PageEdit } from "@/lib/pdf/organize";
import type { PdfJob } from "@/lib/pdf/jobs";

interface OrganizeRotatePanelProps {
  file: File;
  edits: PageEdit[];
  restricted: boolean;
  runJob: (job: PdfJob) => Promise<{ filename: string; bytes: ArrayBuffer }>;
  onApply: (file: File) => void;
}

export function OrganizeRotatePanel({ file, edits, restricted, runJob, onApply }: OrganizeRotatePanelProps) {
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setStatus("working");
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const result = await runJob({ type: "organize", bytes, edits });
      onApply(new File([result.bytes], result.filename, { type: "application/pdf" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {restricted
          ? "Click ⟳ on a page to rotate it, or use “Rotate all pages” above."
          : "Drag pages to reorder them, click ✕ to delete a page, ⟳ to rotate it."}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleSave}
        disabled={status === "working" || edits.length === 0}
        className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
      >
        {status === "working" ? "Working…" : "Save changes"}
      </button>
    </div>
  );
}
