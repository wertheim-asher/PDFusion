"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FileDropzone } from "@/components/FileDropzone";
import { PdfPageGrid } from "@/components/PdfPageGrid";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import { useWorkspace } from "@/hooks/useWorkspace";
import { TOOLS, type ToolSlug } from "@/lib/tools";
import { Toolbar } from "./Toolbar";
import { FileTray } from "./FileTray";
import { ToolPanel } from "./ToolPanel";

const LARGE_FILE_WARNING_BYTES = 150 * 1024 * 1024;

export function Workspace() {
  const ws = useWorkspace();
  const { runJob } = usePdfWorker();
  const [splitSelection, setSplitSelection] = useState<number[]>([]);

  useEffect(() => {
    // Static export can't read the ?tool= query param server-side, so pick it
    // up client-side — this only matters for old /tools/[slug] links redirected here.
    const tool = new URLSearchParams(window.location.search).get("tool");
    if (tool && tool in TOOLS) ws.setActiveTool(tool as ToolSlug);
    // Runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Clears Split's page selection when switching tools, not state derived
    // from props (selection isn't part of undo history — see PdfPageGrid).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSplitSelection([]);
  }, [ws.activeTool]);

  const isMultiFileTool = ws.activeTool === "merge-pdf" || ws.activeTool === "jpg-to-pdf";
  const isPdfSingle = ws.files.length === 1 && ws.files[0].type === "application/pdf";
  const downloadUrl = useMemo(() => (isPdfSingle ? URL.createObjectURL(ws.files[0]) : null), [isPdfSingle, ws.files]);
  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);
  // Merge/JPG→PDF always show the tray (even with just one file loaded so
  // far) so "add another file" is never gated behind a second upload.
  const showTray = ws.files.length > 0 && (isMultiFileTool || !isPdfSingle);

  const gridProps =
    ws.activeTool === "organize-pdf"
      ? { allowReorder: true, allowDelete: true, allowRotate: true, selectable: false }
      : ws.activeTool === "rotate-pdf"
        ? { allowReorder: false, allowDelete: false, allowRotate: true, selectable: false }
        : ws.activeTool === "split-pdf"
          ? { allowReorder: false, allowDelete: false, allowRotate: false, selectable: true }
          : { allowReorder: false, allowDelete: false, allowRotate: false, selectable: false };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Link href="/">
            <Logo iconClassName="h-8 w-8" textClassName="text-2xl" />
          </Link>
          <p className="mt-2 text-gray-600">
            Free PDF tools that run entirely in your browser. Your files never leave your device.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Toolbar
          activeTool={ws.activeTool}
          onSelectTool={ws.setActiveTool}
          canUndo={ws.canUndo}
          canRedo={ws.canRedo}
          onUndo={ws.undo}
          onRedo={ws.redo}
          onStartOver={ws.startOver}
          hasFiles={ws.files.length > 0}
        />

        {ws.files.length === 0 && !ws.activeTool ? (
          <FileDropzone
            accept="application/pdf,image/jpeg,image/png"
            multiple
            label="Drop a PDF or images here to get started"
            hint="Or pick a tool above."
            onFiles={ws.setFiles}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {downloadUrl && (
                <div className="flex justify-end">
                  <a
                    href={downloadUrl}
                    download={ws.files[0].name}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  >
                    ↓ Download current file
                  </a>
                </div>
              )}
              {ws.files.some((f) => f.size > LARGE_FILE_WARNING_BYTES) && (
                <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
                  Large files are processed entirely in your browser and may run slowly or run out of memory,
                  depending on your device.
                </p>
              )}
              {ws.files.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
                  Upload a file using the panel on the right.
                </p>
              ) : showTray ? (
                <FileTray
                  files={ws.files}
                  onFilesChange={ws.setFiles}
                  accept={ws.files[0].type.startsWith("image/") ? "image/jpeg,image/png" : "application/pdf"}
                  addLabel={ws.files[0].type.startsWith("image/") ? "Add more images" : "Add more PDFs"}
                />
              ) : (
                <PdfPageGrid
                  file={ws.files[0]}
                  edits={ws.edits}
                  onEditsChange={ws.setEdits}
                  onLoaded={ws.initEdits}
                  onSelectionChange={setSplitSelection}
                  {...gridProps}
                />
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                {ws.activeTool ? (
                  <>
                    <h3 className="mb-3 font-semibold text-gray-900">{TOOLS[ws.activeTool].title}</h3>
                    <ToolPanel
                      tool={ws.activeTool}
                      files={ws.files}
                      edits={ws.edits}
                      splitSelection={splitSelection}
                      runJob={runJob}
                      onApply={ws.applyResult}
                      onRequestFiles={ws.setFiles}
                    />
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Pick a tool above to get started.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
