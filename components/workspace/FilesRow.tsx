"use client";

import { useRef, useState } from "react";
import { FileCard } from "./FileCard";
import type { WorkspaceFile } from "@/hooks/useWorkspace";
import type { PageEdit } from "@/lib/pdf/organize";
import type { ToolSlug } from "@/lib/tools";

interface FilesRowProps {
  files: WorkspaceFile[];
  checked: Set<string>;
  onToggleChecked: (id: string) => void;
  onRemove: (id: string) => void;
  onRemoveChecked: () => void;
  onReorder: (from: number, to: number) => void;
  onAddFiles: (files: File[]) => void;
  edits: Record<string, PageEdit[]>;
  onFileEditsChange: (id: string, edits: PageEdit[]) => void;
  onFileLoaded: (id: string, edits: PageEdit[]) => void;
  activeTool: ToolSlug | null;
  onSelectionChange: (id: string, indices: number[]) => void;
}

const PAGE_TOOL_GRID_PROPS: Record<string, { allowReorder?: boolean; allowDelete?: boolean; allowRotate?: boolean; selectable?: boolean }> = {
  "organize-pdf": { allowReorder: true, allowDelete: true, allowRotate: true },
  "rotate-pdf": { allowReorder: false, allowDelete: false, allowRotate: true },
  "split-pdf": { allowReorder: false, allowDelete: false, allowRotate: false, selectable: true },
};

export function FilesRow({
  files,
  checked,
  onToggleChecked,
  onRemove,
  onRemoveChecked,
  onReorder,
  onAddFiles,
  edits,
  onFileEditsChange,
  onFileLoaded,
  activeTool,
  onSelectionChange,
}: FilesRowProps) {
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [addDragOver, setAddDragOver] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null || from === targetIndex) return;
    onReorder(from, targetIndex);
  };

  const pageToolGridProps = activeTool ? PAGE_TOOL_GRID_PROPS[activeTool] : undefined;

  return (
    <div className="space-y-2">
      {checked.size > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRemoveChecked}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            🗑 Remove {checked.size} checked
          </button>
        </div>
      )}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {files.map((wf, index) => {
          const interactive = checked.size === 1 && checked.has(wf.id) && !!pageToolGridProps;
          return (
            <FileCard
              key={wf.id}
              wf={wf}
              checked={checked.has(wf.id)}
              onToggleChecked={() => onToggleChecked(wf.id)}
              onRemove={() => onRemove(wf.id)}
              edits={edits[wf.id] ?? []}
              onEditsChange={(next) => onFileEditsChange(wf.id, next)}
              onLoaded={(next) => onFileLoaded(wf.id, next)}
              interactive={interactive}
              gridProps={pageToolGridProps ?? {}}
              onSelectionChange={(indices) => onSelectionChange(wf.id, indices)}
              draggable={files.length > 1}
              onDragStart={() => (dragIndex.current = index)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(index);
              }}
              onDrop={() => handleDrop(index)}
              isDragOver={dragOverIndex === index}
            />
          );
        })}

        <div
          role="button"
          tabIndex={0}
          onClick={() => addInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") addInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setAddDragOver(true);
          }}
          onDragLeave={() => setAddDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setAddDragOver(false);
            if (e.dataTransfer.files.length) onAddFiles(Array.from(e.dataTransfer.files));
          }}
          className={`flex w-48 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            addDragOver ? "border-red-400 bg-red-50 text-red-600" : "border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500"
          }`}
          style={{ minHeight: files.length > 0 ? undefined : 180 }}
        >
          <span className="text-2xl">+</span>
          <span className="text-xs font-medium">Upload file{files.length > 0 ? "s" : ""}</span>
          <span className="text-[11px] text-gray-400">PDF, JPG, or PNG</span>
          <input
            ref={addInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) onAddFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
