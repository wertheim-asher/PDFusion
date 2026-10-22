"use client";

import { useState, type ReactNode } from "react";
import { Download, RotateCcw } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { saveBlob } from "@/lib/download";
import { formatBytes } from "@/lib/files";
import { ErrorNote, PrimaryAction, WhyDisabled } from "./PanelParts";

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
 * Shared shell for tools whose output isn't "one new PDF in the workspace"
 * (Split can produce several files; PDF→JPG produces images) — the result is
 * offered as a download rather than replacing the working document.
 */
export function DownloadPanel({ applyLabel, applyDisabled, disabledHint, run, children }: DownloadPanelProps) {
  const { status, error, run: runAction, reset } = useAsyncAction();
  const [result, setResult] = useState<DownloadResult | null>(null);

  const handleRun = () =>
    runAction(async () => {
      setResult(await run());
    });

  // Not keyed off `status`: the confirmation flash returns it to idle, but the result must stay until dismissed.
  if (result) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title="All done!">
          Your file is ready: <strong className="font-semibold">{result.filename}</strong> ({formatBytes(result.blob.size)}).
        </Alert>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          icon={<Download className="h-6 w-6" aria-hidden="true" />}
          onClick={() => saveBlob(result.blob, result.filename)}
        >
          Download
        </Button>
        <Button
          className="w-full"
          variant="secondary"
          icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
          onClick={() => {
            setResult(null);
            reset();
          }}
        >
          Do it again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {children}
      <ErrorNote message={error} />
      <PrimaryAction label={applyLabel} status={status} onClick={handleRun} disabled={applyDisabled} />
      {applyDisabled && disabledHint && <WhyDisabled>{disabledHint}</WhyDisabled>}
    </div>
  );
}
