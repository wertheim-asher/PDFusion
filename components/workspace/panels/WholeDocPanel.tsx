"use client";

import { ReactNode, useState } from "react";
import type { WorkspaceFile } from "@/hooks/useWorkspace";

interface WholeDocPanelProps<TOptions> {
  files: WorkspaceFile[];
  initialOptions: TOptions;
  applyLabel: string;
  renderFields: (args: { options: TOptions; setOptions: (options: TOptions) => void }) => ReactNode;
  run: (file: File, options: TOptions) => Promise<File>;
  onApply: (updates: { id: string; file: File }[]) => void;
}

/**
 * Shared shell for tools that take one or more checked PDFs + some options
 * and produce new PDFs that replace each working document in place
 * (Compress, Watermark, Page Numbers, Crop, Protect, Unlock). Handles the
 * options form, "Apply to N files" button, and loading/error states.
 */
export function WholeDocPanel<TOptions>({
  files,
  initialOptions,
  applyLabel,
  renderFields,
  run,
  onApply,
}: WholeDocPanelProps<TOptions>) {
  const [options, setOptions] = useState<TOptions>(initialOptions);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    setStatus("working");
    setError(null);
    try {
      const updates = await Promise.all(
        files.map(async (wf) => ({ id: wf.id, file: await run(wf.file, options) }))
      );
      onApply(updates);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      {renderFields({ options, setOptions })}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleApply}
        disabled={status === "working" || files.length === 0}
        className="w-full rounded-lg px-6 py-3 font-semibold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundColor: status === "done" ? "#16a34a" : "#dc2626" }}
      >
        {status === "working"
          ? "Working…"
          : status === "done"
            ? "✓ Applied"
            : `${applyLabel}${files.length > 1 ? ` (${files.length} files)` : ""}`}
      </button>
    </div>
  );
}
