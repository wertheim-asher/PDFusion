"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PageEdit } from "@/lib/pdf/organize";

interface PdfPageGridProps {
  file: File | null;
  /** Current order + rotation, single source of truth — this is what makes undo/redo work. */
  edits: PageEdit[];
  onEditsChange?: (edits: PageEdit[]) => void;
  /** Fired once when a new file's thumbnails finish loading, with the identity edit list. Not a user action. */
  onLoaded?: (edits: PageEdit[]) => void;
  /**
   * When false the pages are a compact, read-only preview (used inside file
   * cards). When true they open into a large editor grid with page controls.
   */
  interactive?: boolean;
  allowReorder?: boolean;
  allowDelete?: boolean;
  allowRotate?: boolean;
  /** Click-to-select mode (used by Split) instead of reorder/delete/rotate. */
  selectable?: boolean;
  /** Sorted ascending by original page order. Only used when selectable; not part of undo history. */
  onSelectionChange?: (selectedOriginalIndices: number[]) => void;
}

interface Thumb {
  url: string;
  width: number;
  height: number;
}

const THUMB_SCALE = 0.45;

export function PdfPageGrid({
  file,
  edits,
  onEditsChange,
  onLoaded,
  interactive = false,
  allowReorder = true,
  allowDelete = true,
  allowRotate = true,
  selectable = false,
  onSelectionChange,
}: PdfPageGridProps) {
  // Thumbnails are rendered once per file and cached by original page index —
  // the *displayed* order/rotation/selection is derived from props below, so
  // undo/redo (which just changes the `edits` prop) redraws correctly without
  // ever re-rendering pdf.js pages.
  const [thumbnails, setThumbnails] = useState<Record<number, Thumb>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const onEditsChangeRef = useRef(onEditsChange);
  const onLoadedRef = useRef(onLoaded);
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onEditsChangeRef.current = onEditsChange;
    onLoadedRef.current = onLoaded;
    onSelectionChangeRef.current = onSelectionChange;
  }, [onEditsChange, onLoaded, onSelectionChange]);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const createdUrls: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let loadingTask: any = null;
    // Resets local selection for the newly-loaded file, and kicks off the
    // async pdf.js render below — neither is state derived from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(new Set());
    setProgress({ done: 0, total: 0 });
    setLoadError(null);
    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        const buf = await file.arrayBuffer();
        if (cancelled) return;
        loadingTask = pdfjsLib.getDocument({ data: buf });
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        const next: Record<number, Thumb> = {};
        const identityEdits: PageEdit[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          setProgress({ done: i - 1, total: pdf.numPages });
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: THUMB_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // intent: "print" skips pdf.js's requestAnimationFrame-based scheduling,
          // which never fires (and hangs the render forever) when the tab isn't
          // actively compositing frames, e.g. a backgrounded/inactive browser tab.
          await page.render({ canvas, viewport, intent: "print" }).promise;
          if (cancelled) return;
          const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't encode page preview"))), "image/png")
          );
          const url = URL.createObjectURL(blob);
          createdUrls.push(url);
          next[i - 1] = { url, width: canvas.width, height: canvas.height };
          identityEdits.push({ originalIndex: i - 1, rotateBy: 0 });
        }
        if (!cancelled) {
          setThumbnails(next);
          setProgress(null);
          onLoadedRef.current?.(identityEdits);
        }
      } catch (err) {
        if (cancelled) return;
        setProgress(null);
        const isPasswordProtected = err instanceof Error && err.name === "PasswordException";
        setLoadError(
          isPasswordProtected
            ? "This PDF is password-protected. Use Unlock PDF first to preview or edit its pages."
            : "Couldn't read this PDF's pages — it may be damaged."
        );
        if (!isPasswordProtected) console.error("[PdfPageGrid] failed to render pages:", err);
      }
    })();
    return () => {
      cancelled = true;
      loadingTask?.destroy();
      for (const url of createdUrls) URL.revokeObjectURL(url);
    };
  }, [file]);

  const commitEdits = (next: PageEdit[]) => onEditsChangeRef.current?.(next);

  const removePage = (index: number) => commitEdits(edits.filter((_, i) => i !== index));

  const rotatePage = (index: number) =>
    commitEdits(edits.map((e, i) => (i === index ? { ...e, rotateBy: (e.rotateBy + 90) % 360 } : e)));

  const rotateAll = () => commitEdits(edits.map((e) => ({ ...e, rotateBy: (e.rotateBy + 90) % 360 })));

  const movePage = (from: number, to: number) => {
    if (to < 0 || to >= edits.length || from === to) return;
    const next = [...edits];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commitEdits(next);
  };

  const applySelection = (next: Set<number>) => {
    setSelected(next);
    onSelectionChangeRef.current?.(Array.from(next).sort((a, b) => a - b));
  };

  const toggleSelected = (originalIndex: number) => {
    const next = new Set(selected);
    if (next.has(originalIndex)) next.delete(originalIndex);
    else next.add(originalIndex);
    applySelection(next);
  };

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from !== null) movePage(from, targetIndex);
  };

  if (!file) return null;
  if (loadError) {
    return (
      <p className="rounded-xl border-2 border-warn bg-warn-tint px-3 py-2.5 text-sm text-ink">{loadError}</p>
    );
  }
  if (progress && edits.length === 0) {
    const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
    return (
      <div role="status" className="py-4 text-center">
        <p className="text-sm font-medium text-ink-2">
          {progress.total > 0 ? `Reading page ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…` : "Opening PDF…"}
        </p>
        <div className="mx-auto mt-2 h-2 w-full max-w-48 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand transition-[width] duration-150" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  const canReorder = interactive && allowReorder && !selectable;
  const canRotate = interactive && allowRotate;
  const canDelete = interactive && allowDelete;
  const canSelect = interactive && selectable;

  const allOriginalIndices = edits.map((e) => e.originalIndex);

  return (
    <div className="space-y-4">
      {interactive && (
        <div className="flex flex-wrap items-center gap-2">
          {canRotate && !selectable && (
            <Button size="sm" icon={<RotateCw className="h-4 w-4" aria-hidden="true" />} onClick={rotateAll}>
              Rotate all pages
            </Button>
          )}
          {canSelect && (
            <>
              <Button size="sm" onClick={() => applySelection(new Set(allOriginalIndices))}>
                Select all
              </Button>
              <Button size="sm" onClick={() => applySelection(new Set(allOriginalIndices.filter((i) => i % 2 === 0)))}>
                Odd pages
              </Button>
              <Button size="sm" onClick={() => applySelection(new Set(allOriginalIndices.filter((i) => i % 2 === 1)))}>
                Even pages
              </Button>
              <Button size="sm" variant="ghost" disabled={selected.size === 0} onClick={() => applySelection(new Set())}>
                Clear
              </Button>
              <span className="ml-auto text-sm font-semibold text-ink-2" aria-live="polite">
                {selected.size} of {edits.length} selected
              </span>
            </>
          )}
        </div>
      )}

      <div
        className={
          interactive
            ? "grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4"
            : "grid grid-cols-2 gap-2"
        }
      >
        {edits.map((edit, index) => {
          const thumb = thumbnails[edit.originalIndex];
          const isSelected = selected.has(edit.originalIndex);
          const aspect = thumb ? thumb.width / thumb.height : 0.77;
          const sideways = edit.rotateBy % 180 !== 0;
          // A page turned a quarter-turn swaps its width and height, so shrink it to stay inside its tile.
          const fit = sideways ? Math.min(aspect, 1 / aspect) : 1;
          const pageNumber = index + 1;
          const moved = edit.originalIndex !== index;

          const image = (
            <div
              className="relative w-full overflow-hidden rounded-md bg-white ring-1 ring-line"
              style={{ aspectRatio: aspect }}
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb.url}
                  alt={`Page ${pageNumber}`}
                  draggable={false}
                  style={{ transform: `rotate(${edit.rotateBy}deg) scale(${fit})` }}
                  className="h-full w-full object-contain transition-transform duration-200"
                />
              ) : (
                // Edits can be restored (undo/redo) before the page images are re-rendered; show a placeholder, not a blank sheet.
                <div className="absolute inset-0 animate-pulse bg-paper-2" aria-hidden="true" />
              )}
              {!interactive && (
                <span className="absolute bottom-1 left-1 rounded bg-ink/80 px-1.5 font-display text-[11px] font-bold leading-5 text-white">
                  {pageNumber}
                </span>
              )}
            </div>
          );

          if (!interactive) {
            return (
              <div key={edit.originalIndex} className="animate-page-in">
                {image}
              </div>
            );
          }

          if (canSelect) {
            return (
              <button
                key={edit.originalIndex}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`Page ${pageNumber}`}
                onClick={() => toggleSelected(edit.originalIndex)}
                className={`animate-page-in relative rounded-xl border-2 p-2 text-left transition-all duration-150 ${
                  isSelected
                    ? "border-ink bg-brand-tint shadow-[0_3px_0_0_var(--color-ink)]"
                    : "border-line bg-card hover:border-ink-3"
                }`}
              >
                {image}
                <span className="mt-2 flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-ink">Page {pageNumber}</span>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected ? "border-ink bg-brand text-white" : "border-ink-3 bg-card"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                </span>
              </button>
            );
          }

          return (
            <div
              key={edit.originalIndex}
              draggable={canReorder}
              onDragStart={(e) => {
                dragIndex.current = index;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(index));
              }}
              onDragOver={(e) => {
                if (!canReorder) return;
                e.preventDefault();
                setDragOverIndex(index);
              }}
              onDragLeave={() => setDragOverIndex((i) => (i === index ? null : i))}
              onDrop={(e) => {
                if (!canReorder) return;
                e.preventDefault();
                handleDrop(index);
              }}
              onDragEnd={() => setDragOverIndex(null)}
              className={`animate-page-in rounded-xl border-2 bg-card p-2 transition-all duration-150 ${
                canReorder ? "cursor-grab active:cursor-grabbing" : ""
              } ${dragOverIndex === index ? "scale-[1.03] border-brand shadow-[0_4px_0_0_var(--color-brand)]" : "border-line"}`}
            >
              {image}
              <div className="mt-2 flex items-baseline justify-between gap-2 px-0.5">
                <span className="font-display text-sm font-bold text-ink">Page {pageNumber}</span>
                {moved && <span className="text-xs text-ink-3">was {edit.originalIndex + 1}</span>}
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {canReorder && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      iconOnly
                      aria-label={`Move page ${pageNumber} earlier`}
                      disabled={index === 0}
                      onClick={() => movePage(index, index - 1)}
                      icon={<ChevronLeft className="h-5 w-5" aria-hidden="true" />}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      iconOnly
                      aria-label={`Move page ${pageNumber} later`}
                      disabled={index === edits.length - 1}
                      onClick={() => movePage(index, index + 1)}
                      icon={<ChevronRight className="h-5 w-5" aria-hidden="true" />}
                    />
                  </>
                )}
                {canRotate && (
                  <Button
                    size="sm"
                    variant="ghost"
                    iconOnly={canReorder || canDelete}
                    className={canReorder || canDelete ? "" : "flex-1"}
                    aria-label={`Rotate page ${pageNumber}`}
                    onClick={() => rotatePage(index)}
                    icon={<RotateCw className="h-5 w-5" aria-hidden="true" />}
                  >
                    Rotate
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    iconOnly
                    className="ml-auto hover:!bg-brand-tint hover:!text-brand-deep"
                    aria-label={`Delete page ${pageNumber}`}
                    onClick={() => removePage(index)}
                    icon={<Trash2 className="h-5 w-5" aria-hidden="true" />}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
