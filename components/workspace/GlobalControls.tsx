"use client";

import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface GlobalControlsProps {
  totalCount: number;
  checkedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteChecked: () => void;
  onDownloadChecked: () => void;
}

export function GlobalControls({
  totalCount,
  checkedCount,
  onSelectAll,
  onDeselectAll,
  onDeleteChecked,
  onDownloadChecked,
}: GlobalControlsProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  if (totalCount === 0) return null;
  const allChecked = checkedCount === totalCount;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-gray-500">
        {totalCount} file{totalCount === 1 ? "" : "s"}
        {checkedCount > 0 ? ` · ${checkedCount} checked` : ""}
      </span>
      <button
        type="button"
        onClick={allChecked ? onDeselectAll : onSelectAll}
        className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 transition-colors hover:bg-gray-50"
      >
        {allChecked ? "Deselect all" : "Select all"}
      </button>
      <button
        type="button"
        onClick={onDownloadChecked}
        disabled={checkedCount === 0}
        className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white"
      >
        ⬇ Download checked
      </button>
      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        disabled={checkedCount === 0}
        aria-label="Delete checked files"
        className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-600"
      >
        🗑 Delete checked
      </button>

      {confirmingDelete && (
        <ConfirmDialog
          message={`Delete ${checkedCount} checked file${checkedCount === 1 ? "" : "s"}? This can't be undone.`}
          confirmLabel="Yes, delete"
          onConfirm={() => {
            onDeleteChecked();
            setConfirmingDelete(false);
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
