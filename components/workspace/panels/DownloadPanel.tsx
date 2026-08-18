"use client";

import { ReactNode, useEffect, useState } from "react";

interface DownloadResult {
  filename: string;
  blob: Blob;
}

interface DownloadPanelProps {
  applyLabel: string;
  applyDisabled?: boolean;
  disabledHint?: string;
  run: () => Promise<DownloadResult>;
  children?: ReactNode;
}

/**
 * Shared shell for tools that produce a different-shaped output than "one
 * new PDF" (Split can produce several files; PDF→JPG produces images) — the
 * result is offered as a download rather than replacing the workspace's
 * working document.
 */
export function DownloadPanel({ applyLabel, applyDisabled, disabledHint, run, children }: DownloadPanelProps) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const handleRun = async () => {
    setStatus("working");
    setError(null);
    try {
      const r = await run();
      setResult(r);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  if (status === "done" && result && downloadUrl) {
    return (
      <div className="space-y-3 text-center">
        <p className="font-medium text-gray-900">Done!</p>
        <a
          href={downloadUrl}
          download={result.filename}
          className="inline-block rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Download {result.filename}
        </a>
        <div>
          <button
            onClick={() => {
              setStatus("idle");
              setResult(null);
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={handleRun}
        disabled={status === "working" || applyDisabled}
        title={applyDisabled ? disabledHint : undefined}
        className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
      >
        {status === "working" ? "Working…" : applyLabel}
      </button>
      {applyDisabled && disabledHint && <p className="text-center text-xs text-gray-500">{disabledHint}</p>}
    </div>
  );
}
