"use client";

import { useCallback, useMemo, useState } from "react";
import type { PageEdit } from "@/lib/pdf/organize";
import type { ToolSlug } from "@/lib/tools";

export interface WorkspaceFile {
  id: string;
  file: File;
}

interface Snapshot {
  files: WorkspaceFile[];
  /** Per-file page order/rotation, keyed by file id. Only meaningful for PDFs being organized/rotated/split. */
  edits: Record<string, PageEdit[]>;
  /** Ids of the files the next tool action applies to. */
  checked: ReadonlySet<string>;
}

const EMPTY_SNAPSHOT: Snapshot = { files: [], edits: {}, checked: new Set() };
const MAX_HISTORY = 20;

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function without(set: ReadonlySet<string>, ids: Iterable<string>): Set<string> {
  const next = new Set(set);
  for (const id of ids) next.delete(id);
  return next;
}

/**
 * Central state for the workspace: every loaded file (each with a stable id
 * so it survives reordering/renaming), per-file page edits, which files are
 * checked for the next tool action, and a linear undo/redo history.
 *
 * The selection lives inside each history snapshot, so undoing e.g. a merge
 * restores the source files *and* the selection they had. Toggling a
 * checkbox just edits the current snapshot in place — it isn't an undo step
 * of its own, only the actions that change files are.
 */
export function useWorkspace() {
  const [history, setHistory] = useState<Snapshot[]>([EMPTY_SNAPSHOT]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTool, setActiveToolState] = useState<ToolSlug | null>(null);

  const current = history[historyIndex];

  // Undo/redo can move to a snapshot whose selection names files that no
  // longer exist; only ever expose ids that match a real file.
  const checked = useMemo(() => {
    const ids = new Set(current.files.map((f) => f.id));
    return new Set([...current.checked].filter((id) => ids.has(id)));
  }, [current.files, current.checked]);

  const commit = useCallback(
    (snapshot: Snapshot) => {
      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndex + 1);
        const next = [...truncated, snapshot];
        return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
      });
      setHistoryIndex((prevIndex) => Math.min(prevIndex + 1, MAX_HISTORY - 1));
    },
    [historyIndex]
  );

  /** Edits the current snapshot without creating an undo step. */
  const patchCurrent = useCallback(
    (patch: (snap: Snapshot) => Snapshot) => {
      setHistory((prev) => {
        const next = [...prev];
        next[historyIndex] = patch(next[historyIndex]);
        return next;
      });
    },
    [historyIndex]
  );

  /** New files arrive selected: whatever you just added is what you want to work on. */
  const addFiles = useCallback(
    (newFiles: File[]) => {
      if (newFiles.length === 0) return;
      const wrapped = newFiles.map((file) => ({ id: makeId(), file }));
      commit({
        files: [...current.files, ...wrapped],
        edits: current.edits,
        checked: new Set([...checked, ...wrapped.map((w) => w.id)]),
      });
    },
    [commit, current.files, current.edits, checked]
  );

  const removeFiles = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      commit({
        files: current.files.filter((f) => !idSet.has(f.id)),
        edits: Object.fromEntries(Object.entries(current.edits).filter(([id]) => !idSet.has(id))),
        checked: without(checked, ids),
      });
    },
    [commit, current.files, current.edits, checked]
  );

  const reorderFiles = useCallback(
    (from: number, to: number) => {
      const files = [...current.files];
      const [moved] = files.splice(from, 1);
      files.splice(to, 0, moved);
      commit({ files, edits: current.edits, checked });
    },
    [commit, current.files, current.edits, checked]
  );

  const setFileEdits = useCallback(
    (id: string, edits: PageEdit[]) => {
      commit({ files: current.files, edits: { ...current.edits, [id]: edits }, checked });
    },
    [commit, current.files, current.edits, checked]
  );

  /**
   * Fills in baseline edits once a file's thumbnails finish loading — edits
   * snapshots in place, not a new undo step (see setFileEdits vs this).
   * Thumbnails load asynchronously, so an action taken before they finish
   * would leave an older snapshot without them; fill those in too (matching
   * on the exact File, since a tool may have since replaced the file's
   * content under the same id).
   */
  const initFileEdits = useCallback(
    (id: string, edits: PageEdit[], file: File) => {
      setHistory((prev) =>
        prev.map((snap, i) => {
          const holdsFile = snap.files.some((f) => f.id === id && f.file === file);
          if (!holdsFile || (i !== historyIndex && snap.edits[id])) return snap;
          return { ...snap, edits: { ...snap.edits, [id]: edits } };
        })
      );
    },
    [historyIndex]
  );

  /** Batch tools: replace the content of specific files in place (same ids, same order), one undo step. */
  const replaceFiles = useCallback(
    (updates: { id: string; file: File }[]) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.file]));
      commit({
        files: current.files.map((f) => (updateMap.has(f.id) ? { id: f.id, file: updateMap.get(f.id)! } : f)),
        edits: Object.fromEntries(Object.entries(current.edits).filter(([id]) => !updateMap.has(id))),
        checked,
      });
    },
    [commit, current.files, current.edits, checked]
  );

  /** Merge/JPG→PDF: remove the given files and insert one new, selected combined file at that position, one undo step. */
  const replaceWithCombined = useCallback(
    (removeIds: string[], newFile: File) => {
      const idSet = new Set(removeIds);
      const index = current.files.findIndex((f) => idSet.has(f.id));
      const kept = current.files.filter((f) => !idSet.has(f.id));
      const insertAt = index === -1 ? kept.length : Math.min(index, kept.length);
      const created = { id: makeId(), file: newFile };
      commit({
        files: [...kept.slice(0, insertAt), created, ...kept.slice(insertAt)],
        edits: Object.fromEntries(Object.entries(current.edits).filter(([id]) => !idSet.has(id))),
        checked: new Set([...without(checked, removeIds), created.id]),
      });
    },
    [commit, current.files, current.edits, checked]
  );

  const toggleChecked = useCallback(
    (id: string) => {
      patchCurrent((snap) => {
        const next = new Set(snap.checked);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { ...snap, checked: next };
      });
    },
    [patchCurrent]
  );

  const selectAll = useCallback(() => {
    patchCurrent((snap) => ({ ...snap, checked: new Set(snap.files.map((f) => f.id)) }));
  }, [patchCurrent]);

  const deselectAll = useCallback(() => patchCurrent((snap) => ({ ...snap, checked: new Set() })), [patchCurrent]);

  /** Single-file tools need exactly one selection; this is the one-click way to get there. */
  const selectOnly = useCallback(
    (id: string) => patchCurrent((snap) => ({ ...snap, checked: new Set([id]) })),
    [patchCurrent]
  );

  /** Clicking the active tool again closes it. */
  const setActiveTool = useCallback((tool: ToolSlug) => {
    setActiveToolState((prev) => (prev === tool ? null : tool));
  }, []);

  /** Opens a tool without toggling — for links and other places that mean "show this one", not "flip it". */
  const openTool = useCallback((tool: ToolSlug) => setActiveToolState(tool), []);

  const undo = useCallback(() => setHistoryIndex((i) => Math.max(0, i - 1)), []);
  const redo = useCallback(() => setHistoryIndex((i) => Math.min(history.length - 1, i + 1)), [history.length]);

  const startOver = useCallback(() => {
    setHistory([EMPTY_SNAPSHOT]);
    setHistoryIndex(0);
    setActiveToolState(null);
  }, []);

  return useMemo(
    () => ({
      files: current.files,
      edits: current.edits,
      activeTool,
      checked,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
      setActiveTool,
      openTool,
      addFiles,
      removeFiles,
      reorderFiles,
      setFileEdits,
      initFileEdits,
      replaceFiles,
      replaceWithCombined,
      toggleChecked,
      selectAll,
      deselectAll,
      selectOnly,
      undo,
      redo,
      startOver,
    }),
    [
      current,
      activeTool,
      checked,
      historyIndex,
      history.length,
      setActiveTool,
      openTool,
      addFiles,
      removeFiles,
      reorderFiles,
      setFileEdits,
      initFileEdits,
      replaceFiles,
      replaceWithCombined,
      toggleChecked,
      selectAll,
      deselectAll,
      selectOnly,
      undo,
      redo,
      startOver,
    ]
  );
}

export type Workspace = ReturnType<typeof useWorkspace>;
