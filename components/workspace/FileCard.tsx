"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PdfPageGrid } from "@/components/PdfPageGrid";
import type { WorkspaceFile } from "@/hooks/useWorkspace";
import type { PageEdit } from "@/lib/pdf/organize";

interface GridProps {
  allowReorder?: boolean;
  allowDelete?: boolean;
  allowRotate?: boolean;
  selectable?: boolean;
}

interface FileCardProps {
  wf: WorkspaceFile;
  checked: boolean;
  onToggleChecked: () => void;
  onRemove: () => void;
  edits: PageEdit[];
  onEditsChange: (edits: PageEdit[]) => void;
  onLoaded: (edits: PageEdit[]) => void;
  interactive: boolean;
  gridProps: GridProps;
  onSelectionChange?: (indices: number[]) => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragOver: boolean;
}

export function FileCard({
  wf,
  checked,
  onToggleChecked,
  onRemove,
  edits,
  onEditsChange,
  onLoaded,
  interactive,
  gridProps,
  onSelectionChange,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: FileCardProps) {
  const isImage = wf.file.type.startsWith("image/");
  const objectUrl = useMemo(() => (isImage ? URL.createObjectURL(wf.file) : null), [isImage, wf.file]);
  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const [popped, setPopped] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setPopped(true);
    const t = setTimeout(() => setPopped(false), 250);
    return () => clearTimeout(t);
  }, [checked]);

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`animate-card-in flex w-48 shrink-0 flex-col rounded-xl border bg-white shadow-sm transition-all duration-150 ${
        checked ? "border-red-400 ring-1 ring-red-300" : isDragOver ? "border-red-300 scale-[1.02] shadow-md" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-2 py-2">
        <button
          type="button"
          onClick={onToggleChecked}
          aria-pressed={checked}
          aria-label={checked ? `Uncheck ${wf.file.name}` : `Check ${wf.file.name}`}
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] transition-colors ${
            checked ? "border-red-500 bg-red-500 text-white" : "border-gray-300 hover:border-gray-400"
          } ${popped ? "animate-pop" : ""}`}
        >
          {checked ? "✓" : ""}
        </button>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700" title={wf.file.name}>
          {wf.file.name}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${wf.file.name}`}
          className="shrink-0 text-gray-400 transition-colors hover:text-red-600"
        >
          ✕
        </button>
      </div>

      <div className="max-h-96 flex-1 overflow-y-auto p-2">
        {isImage && objectUrl ? (
          <img src={objectUrl} alt={wf.file.name} className="w-full h-auto rounded" />
        ) : (
          <PdfPageGrid
            file={wf.file}
            edits={edits}
            onEditsChange={onEditsChange}
            onLoaded={onLoaded}
            interactive={interactive}
            onSelectionChange={onSelectionChange}
            {...gridProps}
          />
        )}
      </div>

      <FileCardFooter file={wf.file} />
    </div>
  );
}

function FileCardFooter({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-2 py-1.5 text-[11px] text-gray-400">
      <span>{formatBytes(file.size)}</span>
      <a href={url} download={file.name} className="text-gray-500 hover:text-red-600 transition-colors">
        ↓ Download
      </a>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
