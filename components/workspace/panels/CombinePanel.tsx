"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { WorkspaceFile } from "@/hooks/useWorkspace";
import { ErrorNote, PrimaryAction } from "./PanelParts";

interface CombinePanelProps {
  /** Selected files this tool uses, in file-list order — which is the order they'll be combined in. */
  files: WorkspaceFile[];
  intro: string;
  cta: string;
  run: (files: WorkspaceFile[]) => Promise<{ filename: string; bytes: ArrayBuffer }>;
  onApply: (removeIds: string[], newFile: File, summary: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  summarize: (count: number, filename: string) => string;
}

/** Merge and Images→PDF: turn several files into one, with the order visible and adjustable right here. */
export function CombinePanel({ files, intro, cta, run, onApply, onMove, summarize }: CombinePanelProps) {
  const { status, error, run: runAction } = useAsyncAction();

  const handleApply = () =>
    runAction(async () => {
      const result = await run(files);
      onApply(
        files.map((wf) => wf.id),
        new File([result.bytes], result.filename, { type: "application/pdf" }),
        summarize(files.length, result.filename)
      );
    });

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[15px] text-ink-2">{intro}</p>
        <ol className="space-y-2">
          {files.map((wf, i) => (
            <li key={wf.id} className="flex items-center gap-2 rounded-xl border-2 border-line bg-paper py-1.5 pl-2.5 pr-1.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink" title={wf.file.name}>
                {wf.file.name}
              </span>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                aria-label={`Move ${wf.file.name} up`}
                disabled={i === 0}
                onClick={() => onMove(wf.id, -1)}
                icon={<ArrowUp className="h-5 w-5" aria-hidden="true" />}
              />
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                aria-label={`Move ${wf.file.name} down`}
                disabled={i === files.length - 1}
                onClick={() => onMove(wf.id, 1)}
                icon={<ArrowDown className="h-5 w-5" aria-hidden="true" />}
              />
            </li>
          ))}
        </ol>
      </div>
      <ErrorNote message={error} />
      <PrimaryAction label={cta} status={status} onClick={handleApply} doneLabel="Combined" />
    </div>
  );
}
