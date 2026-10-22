"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleHelp, Redo2, ShieldCheck, Undo2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ToolIcon } from "@/components/ToolIcon";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ToastHost, useToast } from "@/components/ui/Toast";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import { useWorkspace } from "@/hooks/useWorkspace";
import { DOWNLOAD_STARTED_EVENT, downloadFiles } from "@/lib/download";
import { ACCEPT_ATTR, plural, splitAcceptedFiles } from "@/lib/files";
import { TOOLS, type ToolSlug } from "@/lib/tools";
import { ConfirmDialog } from "./ConfirmDialog";
import { DropOverlay } from "./DropOverlay";
import { FilesGrid } from "./FilesGrid";
import { GlobalControls } from "./GlobalControls";
import { HelpDialog } from "./HelpDialog";
import { ToolPanel } from "./ToolPanel";
import { ToolSidebar } from "./ToolSidebar";

const LARGE_FILE_WARNING_BYTES = 150 * 1024 * 1024;

/** "⌘" on Apple platforms, "Ctrl+" elsewhere — resolved after mount so server and client markup agree. */
function useModKey(): string {
  const [mod, setMod] = useState("Ctrl+");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setMod("⌘");
  }, []);
  return mod;
}

export function Workspace() {
  const ws = useWorkspace();
  const { runJob } = usePdfWorker();
  const { toast, show: showToast, dismiss: dismissToast } = useToast();
  const mod = useModKey();

  const [splitSelectionByFile, setSplitSelectionByFile] = useState<Record<string, number[]>>({});
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({});
  const [confirmingStartOver, setConfirmingStartOver] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const { accepted, rejected } = splitAcceptedFiles(incoming);
      ws.addFiles(accepted);
      if (rejected.length > 0) {
        const names = rejected.length <= 2 ? rejected.map((f) => `“${f.name}”`).join(" and ") : plural(rejected.length, "file");
        showToast(`Skipped ${names} — only PDF, JPG and PNG files work here.`, { tone: "warn" });
      }
    },
    [ws, showToast]
  );

  const meta = ws.activeTool ? TOOLS[ws.activeTool] : null;
  const selectedCount = ws.checked.size;
  const singleSelectedId = selectedCount === 1 ? Array.from(ws.checked)[0] : null;
  const splitSelection = singleSelectedId ? (splitSelectionByFile[singleSelectedId] ?? []) : [];
  const selectedWorkspaceFiles = ws.files.filter((f) => ws.checked.has(f.id));

  const undoAction = { label: "Undo", onClick: ws.undo };

  const deleteFiles = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const names = ws.files.filter((f) => ids.includes(f.id)).map((f) => f.file.name);
      ws.removeFiles(ids);
      showToast(ids.length === 1 ? `Removed “${names[0]}”.` : `Removed ${plural(ids.length, "file")}.`, {
        tone: "info",
        action: { label: "Undo", onClick: ws.undo },
      });
    },
    [ws, showToast]
  );

  /** Merge/convert order follows the file list, so moving a file means swapping places with its neighbour among the selected ones. */
  const moveSelectedFile = (id: string, direction: -1 | 1) => {
    const ids = ws.files.filter((f) => ws.checked.has(f.id)).map((f) => f.id);
    const at = ids.indexOf(id);
    const neighbour = ids[at + direction];
    if (at === -1 || neighbour === undefined) return;
    ws.reorderFiles(
      ws.files.findIndex((f) => f.id === id),
      ws.files.findIndex((f) => f.id === neighbour)
    );
  };

  useEffect(() => {
    // Static export can't read the ?tool= query param server-side, so pick it
    // up client-side — this only matters for old /tools/[slug] links redirected here.
    const tool = new URLSearchParams(window.location.search).get("tool");
    if (tool && tool in TOOLS) ws.openTool(tool as ToolSlug);
    // Runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Split selection is per-file UI state, not part of undo history — clear
    // it whenever the active tool changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSplitSelectionByFile({});
  }, [ws.activeTool]);

  useEffect(() => {
    // On narrow screens the options panel sits below the file list; bring it into view.
    if (ws.activeTool && window.matchMedia("(max-width: 1023px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [ws.activeTool]);

  // Confirm downloads: some environments (notably the desktop app) show no download UI of their own.
  useEffect(() => {
    const onDownload = (e: Event) => {
      const { filename } = (e as CustomEvent<{ filename: string }>).detail;
      showToast(`Downloading “${filename}” — check your Downloads folder.`, { tone: "info" });
    };
    window.addEventListener(DOWNLOAD_STARTED_EVENT, onDownload);
    return () => window.removeEventListener(DOWNLOAD_STARTED_EVENT, onDownload);
  }, [showToast]);

  // Latest handlers for the long-lived window listeners below, without re-subscribing every render.
  const latest = useRef({ addFiles, deleteFiles, openPicker, ws, modalOpen: false });
  useEffect(() => {
    latest.current = { addFiles, deleteFiles, openPicker, ws, modalOpen: confirmingStartOver || helpOpen };
  });

  // Drop files anywhere on the page.
  useEffect(() => {
    let depth = 0;
    const carriesFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const onEnter = (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      depth += 1;
      setDragging(true);
    };
    const onLeave = (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onOver = (e: DragEvent) => {
      if (carriesFiles(e)) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (!carriesFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      latest.current.addFiles(Array.from(e.dataTransfer?.files ?? []));
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  // Keyboard shortcuts. Text fields keep their own Ctrl+Z/Ctrl+A.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { ws, openPicker, deleteFiles, modalOpen } = latest.current;
      if (modalOpen) return;
      const target = e.target as HTMLElement | null;
      const typing =
        !!target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
      const hasMod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (hasMod && key === "o") {
        e.preventDefault();
        openPicker();
      } else if (typing) {
        return;
      } else if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
      } else if (hasMod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) ws.redo();
        else ws.undo();
      } else if (hasMod && key === "y") {
        e.preventDefault();
        ws.redo();
      } else if (hasMod && key === "a" && ws.files.length > 0) {
        e.preventDefault();
        ws.selectAll();
      } else if (e.key === "Delete" && ws.checked.size > 0) {
        e.preventDefault();
        deleteFiles(Array.from(ws.checked));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasLargeFile = ws.files.some((f) => f.file.size > LARGE_FILE_WARNING_BYTES);

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b-2 border-ink bg-card px-4 lg:px-6">
        <h1 className="sr-only">PDFusion — private PDF tools</h1>
        <Link href="/" aria-label="PDFusion home" className="rounded-lg">
          <Logo />
        </Link>
        <p className="ml-3 hidden items-center gap-2 rounded-full border-2 border-ok/40 bg-ok-tint px-3.5 py-1.5 text-sm font-semibold text-ok md:flex">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Files stay on your device
        </p>
        <div className="ml-auto flex items-center gap-2">
          <Button
            icon={<Undo2 className="h-5 w-5" aria-hidden="true" />}
            onClick={ws.undo}
            disabled={!ws.canUndo}
            title={`Undo (${mod}Z)`}
            aria-label="Undo"
          >
            <span className="hidden md:inline">Undo</span>
          </Button>
          <Button
            icon={<Redo2 className="h-5 w-5" aria-hidden="true" />}
            onClick={ws.redo}
            disabled={!ws.canRedo}
            title={`Redo (${mod}Shift+Z)`}
            aria-label="Redo"
          >
            <span className="hidden md:inline">Redo</span>
          </Button>
          {ws.files.length > 0 && (
            <Button variant="ghost" onClick={() => setConfirmingStartOver(true)} title="Remove everything and begin again">
              Start over
            </Button>
          )}
          <Button
            variant="ghost"
            iconOnly
            aria-label="Help and keyboard shortcuts"
            title="Help and keyboard shortcuts (?)"
            onClick={() => setHelpOpen(true)}
            icon={<CircleHelp className="h-6 w-6" aria-hidden="true" />}
          />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_20rem] xl:grid-cols-[19rem_minmax(0,1fr)_23rem]">
        <main className="desk min-w-0 p-4 sm:p-6 lg:order-2 lg:overflow-y-auto">
          <div className="space-y-4">
            <GlobalControls
              totalCount={ws.files.length}
              selectedCount={selectedCount}
              onSelectAll={ws.selectAll}
              onDeselectAll={ws.deselectAll}
              onDeleteSelected={() => deleteFiles(Array.from(ws.checked))}
              onDownloadSelected={() => downloadFiles(selectedWorkspaceFiles.map((f) => f.file))}
              onAddFiles={openPicker}
            />
            {hasLargeFile && (
              <Alert tone="warn" title="Large file">
                Files are processed entirely on your device, so very large ones may run slowly or run out of memory,
                depending on your computer.
              </Alert>
            )}
            <FilesGrid
              files={ws.files}
              checked={ws.checked}
              onToggleChecked={ws.toggleChecked}
              onRemove={(id) => deleteFiles([id])}
              onReorder={ws.reorderFiles}
              onOpenPicker={openPicker}
              edits={ws.edits}
              onFileEditsChange={ws.setFileEdits}
              onFileLoaded={(id, edits, file) => {
                ws.initFileEdits(id, edits, file);
                setPageCounts((prev) => ({ ...prev, [id]: edits.length }));
              }}
              activeTool={ws.activeTool}
              onSelectionChange={(id, indices) => setSplitSelectionByFile((prev) => ({ ...prev, [id]: indices }))}
            />
          </div>
        </main>

        <aside className="border-t-2 border-ink bg-card lg:order-1 lg:overflow-y-auto lg:border-r lg:border-t-0 lg:border-line">
          <ToolSidebar
            activeTool={ws.activeTool}
            onSelectTool={ws.setActiveTool}
            selectedFiles={selectedWorkspaceFiles.map((f) => f.file)}
            hasFiles={ws.files.length > 0}
          />
        </aside>

        <aside
          ref={panelRef}
          aria-label="Tool options"
          className="scroll-mt-4 border-t-2 border-ink bg-card lg:order-3 lg:overflow-y-auto lg:border-l lg:border-t-0 lg:border-line"
        >
          {ws.activeTool && meta ? (
            <div key={ws.activeTool} className="animate-card-in p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-brand text-white shadow-[0_3px_0_0_var(--color-ink)]">
                  <ToolIcon tool={ws.activeTool} className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl font-extrabold leading-tight text-ink">{meta.title}</h2>
                  <p className="mt-1 text-[15px] leading-snug text-ink-2">{meta.description}</p>
                </div>
              </div>
              <div className="mt-6">
                <ToolPanel
                  tool={ws.activeTool}
                  files={ws.files}
                  checkedIds={ws.checked}
                  edits={ws.edits}
                  pageCounts={pageCounts}
                  splitSelection={splitSelection}
                  runJob={runJob}
                  onApplyBatch={(updates, summary) => {
                    // A tool that found nothing to change shouldn't leave a do-nothing undo step behind.
                    if (updates.length === 0) {
                      showToast(summary, { tone: "info" });
                      return;
                    }
                    ws.replaceFiles(updates);
                    showToast(summary, { action: undoAction });
                  }}
                  onApplyCombine={(removeIds, newFile, summary) => {
                    ws.replaceWithCombined(removeIds, newFile);
                    // The sources are gone, so this tool no longer applies; leave the panel ready for the next choice.
                    ws.closeTool();
                    showToast(summary, { action: undoAction });
                  }}
                  onSelectOnly={ws.selectOnly}
                  onMoveFile={moveSelectedFile}
                  onAddFiles={openPicker}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-ink-3 text-ink-3">
                <ArrowLeft className="hidden h-7 w-7 lg:block" aria-hidden="true" />
              </span>
              <h2 className="font-display text-xl font-extrabold text-ink">Pick a tool</h2>
              <p className="max-w-60 text-[15px] leading-snug text-ink-2">
                {ws.files.length > 0
                  ? "Choose a tool from the list. Its options will show up here."
                  : "Add your files first, then choose a tool. Its options will show up here."}
              </p>
            </div>
          )}
        </aside>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      {dragging && <DropOverlay />}
      {helpOpen && <HelpDialog mod={mod} onClose={() => setHelpOpen(false)} />}
      <ToastHost toast={toast} onDismiss={dismissToast} />

      {confirmingStartOver && (
        <ConfirmDialog
          title="Start over?"
          message={`This removes ${plural(ws.files.length, "file")} and your edit history. It can't be undone.`}
          confirmLabel="Yes, start over"
          onConfirm={() => {
            ws.startOver();
            setSplitSelectionByFile({});
            setConfirmingStartOver(false);
          }}
          onCancel={() => setConfirmingStartOver(false)}
        />
      )}
    </div>
  );
}
