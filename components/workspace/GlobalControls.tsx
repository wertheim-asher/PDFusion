"use client";

import { CheckCheck, Download, Plus, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { plural } from "@/lib/files";

interface GlobalControlsProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onDownloadSelected: () => void;
  onAddFiles: () => void;
}

/** The row of actions that apply to the whole file set — always the same place, always labelled. */
export function GlobalControls({
  totalCount,
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onDownloadSelected,
  onAddFiles,
}: GlobalControlsProps) {
  if (totalCount === 0) return null;
  const allSelected = selectedCount === totalCount;
  const none = selectedCount === 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-none tracking-tight text-ink">Your files</h2>
          <p className="mt-1.5 text-[15px] text-ink-2" aria-live="polite">
            {plural(totalCount, "file")}
            {none ? " · none selected" : ` · ${selectedCount} selected`}
          </p>
        </div>
        <Button icon={<Plus className="h-5 w-5" aria-hidden="true" />} onClick={onAddFiles} title="Add files (Ctrl+O)">
          Add files
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-line bg-card/80 p-2">
        <Button
          variant="ghost"
          icon={allSelected ? <Square className="h-5 w-5" aria-hidden="true" /> : <CheckCheck className="h-5 w-5" aria-hidden="true" />}
          onClick={allSelected ? onDeselectAll : onSelectAll}
        >
          {allSelected ? "Select none" : "Select all"}
        </Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            icon={<Download className="h-5 w-5" aria-hidden="true" />}
            onClick={onDownloadSelected}
            disabled={none}
            title={none ? "Select at least one file to download" : selectedCount > 1 ? "Download the selected files as a zip" : "Download the selected file"}
          >
            Download{none ? "" : ` ${selectedCount}`}
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 className="h-5 w-5" aria-hidden="true" />}
            onClick={onDeleteSelected}
            disabled={none}
            title={none ? "Select at least one file to delete" : "Delete the selected files (you can undo this)"}
          >
            Delete{none ? "" : ` ${selectedCount}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
