"use client";

import { ReactNode, useState } from "react";

interface WholeDocPanelProps<TOptions> {
  file: File;
  initialOptions: TOptions;
  applyLabel: string;
  renderFields: (args: { options: TOptions; setOptions: (options: TOptions) => void }) => ReactNode;
  run: (file: File, options: TOptions) => Promise<File>;
  onApply: (file: File) => void;
}

/**
 * Shared shell for tools that take a single PDF + some options and produce a
 * new PDF that replaces the working document (Compress, Watermark, Page
 * Numbers, Crop, Protect, Unlock). Handles the options form, Apply button,
 * and loading/error states; each tool only supplies its fields and a `run`.
 */
export function WholeDocPanel<TOptions>({
  file,
  initialOptions,
  applyLabel,
  renderFields,
  run,
  onApply,
}: WholeDocPanelProps<TOptions>) {
  const [options, setOptions] = useState<TOptions>(initialOptions);
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    setStatus("working");
    setError(null);
    try {
      const result = await run(file, options);
      onApply(result);
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
        disabled={status === "working"}
        className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
      >
        {status === "working" ? "Working…" : applyLabel}
      </button>
    </div>
  );
}
