"use client";

import { Alert } from "@/components/ui/Alert";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { WorkspaceFile } from "@/hooks/useWorkspace";
import type { PageEdit } from "@/lib/pdf/organize";
import type { PdfJob } from "@/lib/pdf/jobs";
import { plural, renamePdf } from "@/lib/files";
import { TOOLS } from "@/lib/tools";
import { ErrorNote, PrimaryAction, WhyDisabled } from "./PanelParts";

interface OrganizeRotatePanelProps {
  file: WorkspaceFile;
  edits: PageEdit[];
  /** Page count as first loaded, so deletions can be counted. Undefined while the pages are still loading. */
  pageCount: number | undefined;
  restricted: boolean;
  runJob: (job: PdfJob) => Promise<{ filename: string; bytes: ArrayBuffer }>;
  onApply: (updates: { id: string; file: File }[], summary: string) => void;
}

export function OrganizeRotatePanel({ file, edits, pageCount, restricted, runJob, onApply }: OrganizeRotatePanelProps) {
  const { status, error, run } = useAsyncAction();

  const loading = pageCount === undefined || edits.length === 0;
  const rotated = edits.filter((e) => e.rotateBy % 360 !== 0).length;
  const deleted = pageCount === undefined ? 0 : Math.max(0, pageCount - edits.length);
  const keptOrder = edits.map((e) => e.originalIndex);
  const reordered = keptOrder.some((original, i) => i > 0 && original < keptOrder[i - 1]);

  const changes = [
    rotated > 0 ? `${plural(rotated, "page")} rotated` : null,
    deleted > 0 ? `${plural(deleted, "page")} deleted` : null,
    reordered ? "pages reordered" : null,
  ].filter((c): c is string => c !== null);
  const hasChanges = changes.length > 0;

  const handleSave = () =>
    run(async () => {
      const bytes = await file.file.arrayBuffer();
      const result = await runJob({ type: "organize", bytes, edits });
      // Keep the person's own file name (not the worker's generic one) so they can still tell their files apart.
      const name = renamePdf(file.file.name, "-edited");
      onApply(
        [{ id: file.id, file: new File([result.bytes], name, { type: "application/pdf" }) }],
        `Saved your changes as “${name}”.`
      );
    });

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-ink-2">
        {restricted ? "Rotating" : "Editing"} <strong className="font-semibold text-ink">{file.file.name}</strong>. The pages are open
        in the middle of the screen — make your changes there.
      </p>

      {loading ? (
        <Alert tone="info">Reading the pages…</Alert>
      ) : hasChanges ? (
        <Alert tone="info" title="Not saved yet">
          {changes.join(" · ")}
        </Alert>
      ) : (
        <Alert tone="info">No changes yet.</Alert>
      )}

      <ErrorNote message={error} />
      <PrimaryAction
        label={TOOLS[restricted ? "rotate-pdf" : "organize-pdf"].cta}
        status={status}
        onClick={handleSave}
        disabled={!hasChanges}
        doneLabel="Saved"
      />
      {!hasChanges && !loading && <WhyDisabled>Make a change to the pages first.</WhyDisabled>}
    </div>
  );
}
