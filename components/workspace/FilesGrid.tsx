"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { FileCard } from "./FileCard";
import { EmptyState } from "./EmptyState";
import type { WorkspaceFile } from "@/hooks/useWorkspace";
import type { PageEdit } from "@/lib/pdf/organize";
import type { ToolSlug } from "@/lib/tools";

interface FilesGridProps {
  files: WorkspaceFile[];
  checked: ReadonlySet<string>;
  onToggleChecked: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onOpenPicker: () => void;
  edits: Record<string, PageEdit[]>;
  onFileEditsChange: (id: string, edits: PageEdit[]) => void;
  onFileLoaded: (id: string, edits: PageEdit[], file: File) => void;
  activeTool: ToolSlug | null;
  onSelectionChange: (id: string, indices: number[]) => void;
}

/** Tools that work on a single file's pages: how the page editor behaves, and what it tells the user. */
const PAGE_TOOLS: Record<string, { grid: { allowReorder?: boolean; allowDelete?: boolean; allowRotate?: boolean; selectable?: boolean }; hint: string }> = {
  "organize-pdf": {
    grid: { allowReorder: true, allowDelete: true, allowRotate: true },
    hint: "Drag pages — or use the arrows — to reorder them. Rotate or delete any page. Nothing changes until you save.",
  },
  "rotate-pdf": {
    grid: { allowReorder: false, allowDelete: false, allowRotate: true },
    hint: "Rotate single pages, or all of them at once. Nothing changes until you save.",
  },
  "split-pdf": {
    grid: { allowReorder: false, allowDelete: false, allowRotate: false, selectable: true },
    hint: "Click the pages you want to pull out. Each run of neighbouring pages becomes its own file.",
  },
};

export function FilesGrid({
  files,
  checked,
  onToggleChecked,
  onRemove,
  onReorder,
  onOpenPicker,
  edits,
  onFileEditsChange,
  onFileLoaded,
  activeTool,
  onSelectionChange,
}: FilesGridProps) {
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (files.length === 0) return <EmptyState onOpenPicker={onOpenPicker} />;

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null || from === targetIndex) return;
    onReorder(from, targetIndex);
  };

  const pageTool = activeTool ? PAGE_TOOLS[activeTool] : undefined;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] items-start gap-5">
      {files.map((wf, index) => {
        const interactive = checked.size === 1 && checked.has(wf.id) && !!pageTool && wf.file.type === "application/pdf";
        return (
          <FileCard
            key={wf.id}
            wf={wf}
            checked={checked.has(wf.id)}
            onToggleChecked={() => onToggleChecked(wf.id)}
            onRemove={() => onRemove(wf.id)}
            edits={edits[wf.id] ?? []}
            onEditsChange={(next) => onFileEditsChange(wf.id, next)}
            onLoaded={(next) => onFileLoaded(wf.id, next, wf.file)}
            interactive={interactive}
            pageHint={pageTool?.hint}
            gridProps={pageTool?.grid ?? {}}
            onSelectionChange={(indices) => onSelectionChange(wf.id, indices)}
            draggable={files.length > 1}
            onDragStart={() => (dragIndex.current = index)}
            onDragOver={(e) => {
              // Only a card being dragged is a reorder; files coming in from the desktop are handled page-wide.
              if (dragIndex.current === null) return;
              e.preventDefault();
              setDragOverIndex(index);
            }}
            onDrop={() => handleDrop(index)}
            onDragEnd={() => {
              dragIndex.current = null;
              setDragOverIndex(null);
            }}
            isDragOver={dragOverIndex === index}
          />
        );
      })}

      <button
        type="button"
        onClick={onOpenPicker}
        className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink-3 bg-card/60 p-6 text-center transition-colors hover:border-ink hover:bg-card"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-marker">
          <Plus className="h-7 w-7" strokeWidth={2.75} aria-hidden="true" />
        </span>
        <span className="font-display text-lg font-bold text-ink">Add more files</span>
        <span className="text-sm text-ink-2">PDF, JPG or PNG — or drop them anywhere on the page</span>
      </button>
    </div>
  );
}
