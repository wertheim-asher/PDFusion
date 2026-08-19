"use client";

import { useState } from "react";
import type { WorkspaceFile } from "@/hooks/useWorkspace";
import type { PageEdit } from "@/lib/pdf/organize";
import type { PdfJob } from "@/lib/pdf/jobs";

interface OrganizeRotatePanelProps {
  file: WorkspaceFile;
  edits: PageEdit[];
  restricted: boolean;
  runJob: (job: PdfJob) => Promise<{ filename: string; bytes: ArrayBuffer }>;
  onApply: (updates: { id: string; file: File }[]) => void;
}

export function OrganizeRotatePanel({ file, edits, restricted, runJob, onApply }: OrganizeRotatePanelProps) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setStatus("working");
    setError(null);
    try {
      const bytes = await file.file.arrayBuffer();
      const result = await runJob({ type: "organize", bytes, edits });
      onApply([{ id: file.id, file: new File([result.bytes], result.filename, { type: "application/pdf" }) }]);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {restricted
          ? "Click ⟳ on a page to rotate it, or use “Rotate all” above the pages."
          : "Drag pages to reorder them, click ✕ to delete a page, ⟳ to rotate it."}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleSave}
        disabled={status === "working" || edits.length === 0}
        className="w-full rounded-lg px-6 py-3 font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundColor: status === "done" ? "#16a34a" : "#dc2626" }}
      >
        {status === "working" ? "Working…" : status === "done" ? "✓ Saved" : "Save changes"}
      </button>
    </div>
  );
}
