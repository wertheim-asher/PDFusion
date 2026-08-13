"use client";

import { ReactNode, useEffect, useState } from "react";
import { FileDropzone } from "./FileDropzone";

export interface ToolResult {
  filename: string;
  blob: Blob;
}

interface ToolShellProps<TOptions> {
  title: string;
  description: string;
  accept: string;
  multiple?: boolean;
  dropzoneLabel: string;
  dropzoneHint?: string;
  initialOptions: TOptions;
  renderOptions?: (args: {
    files: File[];
    options: TOptions;
    setOptions: (options: TOptions) => void;
  }) => ReactNode;
  processLabel?: string;
  onProcess: (files: File[], options: TOptions) => Promise<ToolResult>;
}

type Status = "idle" | "ready" | "processing" | "done" | "error";

// Soft warning only — browsers can run out of memory processing very large
// files since everything happens client-side with no server to offload to.
const LARGE_FILE_WARNING_BYTES = 150 * 1024 * 1024;

export function ToolShell<TOptions>({
  title,
  description,
  accept,
  multiple = false,
  dropzoneLabel,
  dropzoneHint,
  initialOptions,
  renderOptions,
  processLabel = "Process",
  onProcess,
}: ToolShellProps<TOptions>) {
  const [status, setStatus] = useState<Status>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<TOptions>(initialOptions);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!result) return;
    // Synchronizes with the browser's Blob URL registry (an external system:
    // object URLs must be explicitly revoked), not state derived from props.
    const url = URL.createObjectURL(result.blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const reset = () => {
    setStatus("idle");
    setFiles([]);
    setOptions(initialOptions);
    setResult(null);
    setError(null);
  };

  const handleFiles = (newFiles: File[]) => {
    setFiles(newFiles);
    setStatus("ready");
  };

  const handleProcess = async () => {
    setStatus("processing");
    setError(null);
    try {
      const toolResult = await onProcess(files, options);
      setResult(toolResult);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-600">{description}</p>

      <div className="mt-8">
        {status === "idle" && (
          <FileDropzone
            accept={accept}
            multiple={multiple}
            label={dropzoneLabel}
            hint={dropzoneHint}
            onFiles={handleFiles}
          />
        )}

        {(status === "ready" || status === "processing") && (
          <div className="space-y-6">
            {files.some((f) => f.size > LARGE_FILE_WARNING_BYTES) && (
              <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
                Large files are processed entirely in your browser and may run slowly or run out of memory,
                depending on your device.
              </p>
            )}
            <ul className="rounded-lg border border-gray-200 divide-y">
              {files.map((f, i) => (
                <li key={i} className="px-4 py-2 text-sm text-gray-700 flex items-center justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-400">{formatBytes(f.size)}</span>
                    {multiple && files.length > 1 && (
                      <span className="flex gap-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={i === 0}
                          onClick={() => setFiles(moveItem(files, i, i - 1))}
                          className="disabled:opacity-30 hover:text-gray-900"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={i === files.length - 1}
                          onClick={() => setFiles(moveItem(files, i, i + 1))}
                          className="disabled:opacity-30 hover:text-gray-900"
                        >
                          ↓
                        </button>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            {renderOptions?.({ files, options, setOptions })}

            <button
              onClick={handleProcess}
              disabled={status === "processing"}
              className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {status === "processing" ? "Working…" : processLabel}
            </button>
          </div>
        )}

        {status === "done" && result && downloadUrl && (
          <div className="space-y-4 text-center">
            <p className="text-lg font-medium text-gray-900">Done!</p>
            <a
              href={downloadUrl}
              download={result.filename}
              className="inline-block rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Download {result.filename}
            </a>
            <div>
              <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 underline">
                Start over
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => setStatus("ready")}
              className="rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-800 hover:bg-gray-300 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
