"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import { useWorkspace } from "@/hooks/useWorkspace";
import { TOOLS, type ToolSlug } from "@/lib/tools";
import { ToolSidebar } from "./ToolSidebar";
import { FilesRow } from "./FilesRow";
import { GlobalControls } from "./GlobalControls";
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
  const checkedWorkspaceFiles = ws.files.filter((f) => ws.checked.has(f.id));

  const downloadChecked = async () => {
    if (checkedWorkspaceFiles.length === 1) {
      const wf = checkedWorkspaceFiles[0];
      const url = URL.createObjectURL(wf.file);
      const a = document.createElement("a");
      a.href = url;
      a.download = wf.file.name;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const zip = new JSZip();
    const usedNames = new Set<string>();
    for (const wf of checkedWorkspaceFiles) {
      let name = wf.file.name;
      let i = 2;
      while (usedNames.has(name)) {
        name = wf.file.name.replace(/(\.[^.]+)?$/, (ext) => ` (${i})${ext}`);
        i++;
      }
      usedNames.add(name);
      zip.file(name, wf.file);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "files.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50">
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/">
          <Logo iconClassName="h-6 w-6" textClassName="text-lg" />
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
          <ToolSidebar
            activeTool={ws.activeTool}
            onSelectTool={ws.setActiveTool}
            checkedFiles={checkedWorkspaceFiles.map((f) => f.file)}
            canUndo={ws.canUndo}
            canRedo={ws.canRedo}
            onUndo={ws.undo}
            onRedo={ws.redo}
            onStartOver={ws.startOver}
            hasFiles={ws.files.length > 0}
          />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4">
          <div className="mb-3 space-y-2">
            <GlobalControls
              totalCount={ws.files.length}
              checkedCount={ws.checked.size}
              onSelectAll={ws.selectAll}
              onDeselectAll={ws.deselectAll}
              onDeleteChecked={() => ws.removeFiles(Array.from(ws.checked))}
              onDownloadChecked={downloadChecked}
            />
            {ws.files.some((f) => f.file.size > LARGE_FILE_WARNING_BYTES) && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Large files are processed entirely in your browser and may run slowly or run out of memory,
                depending on your device.
              </p>
            )}
          </div>

          <FilesRow
            files={ws.files}
            checked={ws.checked}
            onToggleChecked={ws.toggleChecked}
            onRemove={(id) => ws.removeFiles([id])}
            onReorder={ws.reorderFiles}
            onAddFiles={ws.addFiles}
            edits={ws.edits}
            onFileEditsChange={ws.setFileEdits}
            onFileLoaded={ws.initFileEdits}
            activeTool={ws.activeTool}
            onSelectionChange={(id, indices) => setSplitSelectionByFile((prev) => ({ ...prev, [id]: indices }))}
          />
        </main>

        {ws.activeTool && meta && (
          <aside
            className="animate-card-in w-80 shrink-0 overflow-y-auto border-l bg-white p-4"
            style={{ borderColor: `${meta.accent}55` }}
          >
            <h3 className="mb-1 flex items-center gap-2 font-semibold text-gray-900">
              <span aria-hidden="true">{meta.icon}</span>
              {meta.title}
            </h3>
            <p className="mb-3 text-xs text-gray-500">{meta.description}</p>
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
          </aside>
        )}
      </div>
    </div>
  );
}
