"use client";

import { useState, type ReactNode } from "react";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { WorkspaceFile } from "@/hooks/useWorkspace";
import { AppliesTo, ErrorNote, PrimaryAction, WhyDisabled } from "./PanelParts";

export interface WholeDocResult {
  name: string;
  /** Size of the file before the tool ran. */
  before: number;
  /** Size afterwards; equal to `before` when the tool left the file as it was. */
  after: number;
}

interface WholeDocPanelProps<TOptions> {
  files: WorkspaceFile[];
  initialOptions: TOptions;
  applyLabel: string;
  doneLabel?: string;
  renderFields: (args: { options: TOptions; setOptions: (options: TOptions) => void }) => ReactNode;
  /** Returns the new file, or the very same `file` when there's nothing to change. */
  run: (file: File, options: TOptions) => Promise<File>;
  /** Called with the changed files only; empty when the tool had nothing to do. */
  onApply: (updates: { id: string; file: File }[], summary: string) => void;
  summarize: (results: WholeDocResult[]) => string;
  /** A reason the current options can't be applied yet, or null when they're fine. */
  blockedReason?: (options: TOptions) => string | null;
}

/**
 * Shared shell for tools that take one or more selected PDFs + some options
 * and produce new PDFs that replace each working document in place
 * (Compress, Watermark, Page Numbers, Crop, Protect, Unlock). Handles the
 * options form, the main button, per-file progress, and errors.
 */
export function WholeDocPanel<TOptions>({
  files,
  initialOptions,
  applyLabel,
  doneLabel,
  renderFields,
  run,
  onApply,
  summarize,
  blockedReason,
}: WholeDocPanelProps<TOptions>) {
  const [options, setOptions] = useState<TOptions>(initialOptions);
  const [processed, setProcessed] = useState(0);
  const { status, error, run: runAction } = useAsyncAction();

  const blocked = blockedReason?.(options) ?? null;

  const handleApply = () =>
    runAction(async () => {
      setProcessed(0);
      const updates: { id: string; file: File }[] = [];
      const results: WholeDocResult[] = [];
      // One at a time: these are heavy, and running a whole batch at once can exhaust memory.
      for (const wf of files) {
        const next = await run(wf.file, options);
        if (next !== wf.file) updates.push({ id: wf.id, file: next });
        results.push({ name: wf.file.name, before: wf.file.size, after: next.size });
        setProcessed((n) => n + 1);
      }
      onApply(updates, summarize(results));
    });

  return (
    <div className="space-y-5">
      <AppliesTo files={files} />
      {renderFields({ options, setOptions })}
      <ErrorNote message={error} />
      <PrimaryAction
        label={applyLabel}
        doneLabel={doneLabel}
        status={status}
        onClick={handleApply}
        disabled={files.length === 0 || blocked !== null}
        workingLabel={files.length > 1 ? `Working… ${Math.min(processed + 1, files.length)} of ${files.length}` : "Working…"}
      />
      {blocked && <WhyDisabled>{blocked}</WhyDisabled>}
    </div>
  );
}
