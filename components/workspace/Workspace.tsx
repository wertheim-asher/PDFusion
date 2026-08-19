"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import { useWorkspace } from "@/hooks/useWorkspace";
import { TOOLS, type ToolSlug } from "@/lib/tools";
import { Toolbar } from "./Toolbar";
import { FilesRow } from "./FilesRow";
import { ToolPanel } from "./ToolPanel";

const LARGE_FILE_WARNING_BYTES = 150 * 1024 * 1024;

export function Workspace() {
  const ws = useWorkspace();
  const { runJob } = usePdfWorker();
  const [splitSelectionByFile, setSplitSelectionByFile] = useState<Record<string, number[]>>({});

  useEffect(() => {
    // Static export can't read the ?tool= query param server-side, so pick it
    // up client-side — this only matters for old /tools/[slug] links redirected here.
    const tool = new URLSearchParams(window.location.search).get("tool");
    if (tool && tool in TOOLS) ws.setActiveTool(tool as ToolSlug);
    // Runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Split selection is per-file UI state, not part of undo history — clear
    // it whenever the active tool changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSplitSelectionByFile({});
  }, [ws.activeTool]);

  const meta = ws.activeTool ? TOOLS[ws.activeTool] : null;
  const singleCheckedId = ws.checked.size === 1 ? Array.from(ws.checked)[0] : null;
  const splitSelection = singleCheckedId ? (splitSelectionByFile[singleCheckedId] ?? []) : [];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Link href="/">
            <Logo iconClassName="h-8 w-8" textClassName="text-2xl" />
          </Link>
          <p className="mt-2 text-gray-600">
            Free PDF tools that run entirely in your browser. Your files never leave your device.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {ws.files.some((f) => f.file.size > LARGE_FILE_WARNING_BYTES) && (
          <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Large files are processed entirely in your browser and may run slowly or run out of memory, depending on
            your device.
          </p>
        )}

        <FilesRow
          files={ws.files}
          checked={ws.checked}
          onToggleChecked={ws.toggleChecked}
          onRemove={(id) => ws.removeFiles([id])}
          onRemoveChecked={() => ws.removeFiles(Array.from(ws.checked))}
          onReorder={ws.reorderFiles}
          onAddFiles={ws.addFiles}
          edits={ws.edits}
          onFileEditsChange={ws.setFileEdits}
          onFileLoaded={ws.initFileEdits}
          activeTool={ws.activeTool}
          onSelectionChange={(id, indices) => setSplitSelectionByFile((prev) => ({ ...prev, [id]: indices }))}
        />

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

        {ws.activeTool && meta && (
          <div
            className="animate-card-in rounded-xl border bg-white p-4 shadow-sm"
            style={{ borderColor: `${meta.accent}55` }}
          >
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
              <span aria-hidden="true">{meta.icon}</span>
              {meta.title}
            </h3>
            <ToolPanel
              tool={ws.activeTool}
              files={ws.files}
              checkedIds={ws.checked}
              edits={ws.edits}
              splitSelection={splitSelection}
              runJob={runJob}
              onApplyBatch={ws.replaceFiles}
              onApplyCombine={ws.replaceWithCombined}
            />
          </div>
        )}
      </main>
    </div>
  );
}
