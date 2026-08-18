"use client";

import { useEffect, useRef, useState } from "react";
import type { PageEdit } from "@/lib/pdf/organize";

interface PdfPageGridProps {
  file: File | null;
  /** Current order + rotation, single source of truth — this is what makes undo/redo work. */
  edits: PageEdit[];
  onEditsChange?: (edits: PageEdit[]) => void;
  /** Fired once when a new file's thumbnails finish loading, with the identity edit list. Not a user action. */
  onLoaded?: (edits: PageEdit[]) => void;
  allowReorder?: boolean;
  allowDelete?: boolean;
  allowRotate?: boolean;
  /** Click-to-select mode (used by Split) instead of reorder/delete/rotate. */
  selectable?: boolean;
  /** Sorted ascending by original page order. Only used when selectable; not part of undo history. */
  onSelectionChange?: (selectedOriginalIndices: number[]) => void;
}

export function PdfPageGrid({
  file,
  edits,
  onEditsChange,
  onLoaded,
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
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let loadingTask: any = null;
    // Resets local selection for the newly-loaded file, and kicks off the
    // async pdf.js render below — neither is state derived from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(new Set());
    setLoading(true);
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
        const next: Record<number, string> = {};
        const identityEdits: PageEdit[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // intent: "print" skips pdf.js's requestAnimationFrame-based scheduling,
          // which never fires (and hangs the render forever) when the tab isn't
          // actively compositing frames, e.g. a backgrounded/inactive browser tab.
          await page.render({ canvas, viewport, intent: "print" }).promise;
          if (cancelled) return;
          next[i - 1] = canvas.toDataURL("image/png");
          identityEdits.push({ originalIndex: i - 1, rotateBy: 0 });
        }
        if (!cancelled) {
          setThumbnails(next);
          setLoading(false);
          onLoadedRef.current?.(identityEdits);
        }
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        const isPasswordProtected = err instanceof Error && err.name === "PasswordException";
        setLoadError(
          isPasswordProtected
            ? "This PDF is password-protected. Use Unlock PDF first to preview or edit its pages."
            : "Couldn't read this PDF's pages — it may be corrupted."
        );
        if (!isPasswordProtected) console.error("[PdfPageGrid] failed to render pages:", err);
      }
    })();
    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [file]);

  const removePage = (index: number) => onEditsChangeRef.current?.(edits.filter((_, i) => i !== index));

  const rotatePage = (index: number) =>
    onEditsChangeRef.current?.(
      edits.map((e, i) => (i === index ? { ...e, rotateBy: (e.rotateBy + 90) % 360 } : e))
    );

  const rotateAll = () => onEditsChangeRef.current?.(edits.map((e) => ({ ...e, rotateBy: (e.rotateBy + 90) % 360 })));

  const toggleSelected = (originalIndex: number) => {
    const next = new Set(selected);
    if (next.has(originalIndex)) next.delete(originalIndex);
    else next.add(originalIndex);
    setSelected(next);
    onSelectionChangeRef.current?.(Array.from(next).sort((a, b) => a - b));
  };

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null || from === targetIndex) return;
    const next = [...edits];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    onEditsChangeRef.current?.(next);
  };

  if (!file) return null;
  if (loadError) {
    return <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{loadError}</p>;
  }
  if (loading && edits.length === 0) {
    return <p className="text-sm text-gray-500">Loading pages…</p>;
  }

  return (
    <div className="space-y-3">
      {allowRotate && !selectable && (
        <div className="flex justify-end">
          <button type="button" onClick={rotateAll} className="text-sm text-gray-600 hover:text-gray-900 underline">
            Rotate all pages 90°
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {edits.map((edit, index) => {
          const isSelected = selected.has(edit.originalIndex);
          return (
            <div
              key={edit.originalIndex}
              draggable={allowReorder && !selectable}
              onDragStart={() => (dragIndex.current = index)}
              onDragOver={(e) => {
                e.preventDefault();
                if (allowReorder && !selectable) setDragOverIndex(index);
              }}
              onDragLeave={() => setDragOverIndex((i) => (i === index ? null : i))}
              onDrop={() => handleDrop(index)}
              onClick={selectable ? () => toggleSelected(edit.originalIndex) : undefined}
              className={`relative rounded-lg border bg-white p-2 shadow-sm transition-all duration-150 ${
                selectable ? "cursor-pointer" : ""
              } ${
                isSelected
                  ? "border-red-500 ring-2 ring-red-500 bg-red-50"
                  : dragOverIndex === index
                    ? "border-red-300 -translate-y-1 shadow-md"
                    : "border-gray-200"
              }`}
            >
              <img
                src={thumbnails[edit.originalIndex]}
                alt={`Page ${edit.originalIndex + 1}`}
                style={{ transform: `rotate(${edit.rotateBy}deg)` }}
                className="w-full h-auto"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>{edit.originalIndex + 1}</span>
                {selectable ? (
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                      isSelected ? "border-red-500 bg-red-500 text-white" : "border-gray-300"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                ) : (
                  <div className="flex gap-2">
                    {allowRotate && (
                      <button
                        type="button"
                        onClick={() => rotatePage(index)}
                        className="hover:text-gray-800"
                        aria-label="Rotate page"
                      >
                        ⟳
                      </button>
                    )}
                    {allowDelete && (
                      <button
                        type="button"
                        onClick={() => removePage(index)}
                        className="hover:text-red-600"
                        aria-label="Delete page"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
