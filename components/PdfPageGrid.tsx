"use client";

import { useEffect, useRef, useState } from "react";
import type { PageEdit } from "@/lib/pdf/organize";

interface GridPage extends PageEdit {
  id: string;
  thumbnailUrl: string;
}

interface PdfPageGridProps {
  file: File | null;
  allowReorder?: boolean;
  allowDelete?: boolean;
  allowRotate?: boolean;
  onChange: (edits: PageEdit[]) => void;
}

export function PdfPageGrid({
  file,
  allowReorder = true,
  allowDelete = true,
  allowRotate = true,
  onChange,
}: PdfPageGridProps) {
  const [pages, setPages] = useState<GridPage[]>([]);
  const [loading, setLoading] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let loadingTask: any = null;
    // Kicks off the async pdf.js render below, not state derived from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
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
        const next: GridPage[] = [];
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
          next.push({
            id: `${i}-${Math.random().toString(36).slice(2)}`,
            originalIndex: i - 1,
            rotateBy: 0,
            thumbnailUrl: canvas.toDataURL("image/png"),
          });
        }
        if (!cancelled) {
          setPages(next);
          setLoading(false);
          onChangeRef.current(next.map(({ originalIndex, rotateBy }) => ({ originalIndex, rotateBy })));
        }
      } catch (err) {
        if (!cancelled) console.error("[PdfPageGrid] failed to render pages:", err);
      }
    })();
    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [file]);

  const emit = (next: GridPage[]) => {
    setPages(next);
    onChangeRef.current(next.map(({ originalIndex, rotateBy }) => ({ originalIndex, rotateBy })));
  };

  const removePage = (id: string) => emit(pages.filter((p) => p.id !== id));

  const rotatePage = (id: string) =>
    emit(pages.map((p) => (p.id === id ? { ...p, rotateBy: (p.rotateBy + 90) % 360 } : p)));

  const rotateAll = () => emit(pages.map((p) => ({ ...p, rotateBy: (p.rotateBy + 90) % 360 })));

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === targetIndex) return;
    const next = [...pages];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    emit(next);
  };

  if (!file) return null;
  if (loading && pages.length === 0) {
    return <p className="text-sm text-gray-500">Loading pages…</p>;
  }

  return (
    <div className="space-y-3">
      {allowRotate && (
        <div className="flex justify-end">
          <button type="button" onClick={rotateAll} className="text-sm text-gray-600 hover:text-gray-900 underline">
            Rotate all pages 90°
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {pages.map((page, index) => (
        <div
          key={page.id}
          draggable={allowReorder}
          onDragStart={() => (dragIndex.current = index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(index)}
          className="relative rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
        >
          <img
            src={page.thumbnailUrl}
            alt={`Page ${page.originalIndex + 1}`}
            style={{ transform: `rotate(${page.rotateBy}deg)` }}
            className="w-full h-auto"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span>{page.originalIndex + 1}</span>
            <div className="flex gap-2">
              {allowRotate && (
                <button
                  type="button"
                  onClick={() => rotatePage(page.id)}
                  className="hover:text-gray-800"
                  aria-label="Rotate page"
                >
                  ⟳
                </button>
              )}
              {allowDelete && (
                <button
                  type="button"
                  onClick={() => removePage(page.id)}
                  className="hover:text-red-600"
                  aria-label="Delete page"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}
