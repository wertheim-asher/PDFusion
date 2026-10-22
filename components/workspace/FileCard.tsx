"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, GripVertical, X } from "lucide-react";
import { PdfPageGrid } from "@/components/PdfPageGrid";
import { Button } from "@/components/ui/Button";
import { saveBlob } from "@/lib/download";
import { formatBytes, plural } from "@/lib/files";
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
  /** True when a page-level tool is active on this file: the card grows into a full page editor. */
  interactive: boolean;
  /** One-line instructions shown above the page editor. */
  pageHint?: string;
  gridProps: GridProps;
  onSelectionChange?: (indices: number[]) => void;
  draggable: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  isDragOver: boolean;
}

function kindLabel(file: File): string {
  if (file.type === "application/pdf") return "PDF";
  return file.type === "image/png" ? "PNG" : "JPG";
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
  pageHint,
  gridProps,
  onSelectionChange,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver,
}: FileCardProps) {
  const isImage = wf.file.type.startsWith("image/");
  const objectUrl = useMemo(() => (isImage ? URL.createObjectURL(wf.file) : null), [isImage, wf.file]);
  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl]
  );

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

  const meta = [
    kindLabel(wf.file),
    !isImage && edits.length > 0 ? plural(edits.length, "page") : null,
    formatBytes(wf.file.size),
  ]
    .filter(Boolean)
    .join(" · ");

  // While the page editor is open its pages have their own drag-and-drop, so
  // the card itself must not also act as a draggable item.
  const cardDraggable = draggable && !interactive;

  return (
    <div
      draggable={cardDraggable}
      onDragStart={
        cardDraggable
          ? (e) => {
              e.dataTransfer.effectAllowed = "move";
              // Firefox won't start a drag without some data attached.
              e.dataTransfer.setData("text/plain", wf.id);
              onDragStart();
            }
          : undefined
      }
      onDragOver={cardDraggable ? onDragOver : undefined}
      onDrop={cardDraggable ? onDrop : undefined}
      onDragEnd={cardDraggable ? onDragEnd : undefined}
      className={`animate-card-in flex flex-col rounded-2xl border-2 bg-card transition-[border-color,box-shadow,transform] duration-150 ${
        interactive ? "col-span-full" : ""
      } ${
        checked
          ? "border-ink shadow-[0_4px_0_0_var(--color-ink)]"
          : isDragOver
            ? "scale-[1.02] border-brand shadow-[0_4px_0_0_var(--color-brand)]"
            : "border-line hover:border-ink-3"
      }`}
    >
      <div className="flex items-center gap-1 p-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={onToggleChecked}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-paper"
        >
          <span
            aria-hidden="true"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
              checked ? "border-ink bg-brand text-white" : "border-ink-3 bg-card"
            } ${popped ? "animate-pop" : ""}`}
          >
            {checked && <Check className="h-4 w-4" strokeWidth={3.5} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-bold leading-tight text-ink" title={wf.file.name}>
              {wf.file.name}
            </span>
            <span className="block text-sm text-ink-3">{meta}</span>
          </span>
        </button>
        {cardDraggable && (
          <span className="hidden cursor-grab text-ink-3 sm:block" title="Drag to reorder" aria-hidden="true">
            <GripVertical className="h-5 w-5" />
          </span>
        )}
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          aria-label={`Remove ${wf.file.name}`}
          title="Remove file"
          onClick={onRemove}
          className="hover:!bg-brand-tint hover:!text-brand-deep"
          icon={<X className="h-5 w-5" aria-hidden="true" />}
        />
      </div>

      {interactive && pageHint && (
        <p className="mx-3 mb-3 rounded-lg bg-marker/40 px-3 py-2 text-sm font-medium text-ink">{pageHint}</p>
      )}

      <div
        onClick={interactive ? undefined : onToggleChecked}
        className={
          interactive
            ? "px-3 pb-3"
            : "mx-3 max-h-72 cursor-pointer overflow-y-auto rounded-lg bg-paper p-2"
        }
      >
        {isImage && objectUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={objectUrl} alt={wf.file.name} className="mx-auto max-h-64 w-auto max-w-full rounded object-contain" />
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

      {!interactive && (
        <div className="flex justify-end p-2">
          <Button
            size="sm"
            variant="ghost"
            icon={<Download className="h-4 w-4" aria-hidden="true" />}
            aria-label={`Download ${wf.file.name}`}
            onClick={() => saveBlob(wf.file, wf.file.name)}
          >
            Download
          </Button>
        </div>
      )}
    </div>
  );
}
