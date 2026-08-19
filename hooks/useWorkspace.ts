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
}

const EMPTY_SNAPSHOT: Snapshot = { files: [], edits: {} };
const MAX_HISTORY = 20;

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Central state for the workspace: every loaded file (each with a stable id
 * so it survives reordering/renaming), per-file page edits, which files are
 * checked for the next tool action, and a linear undo/redo history over
 * files+edits. `checked` is deliberately outside history — selecting files
 * isn't a destructive action worth undoing.
 */
export function useWorkspace() {
  const [history, setHistory] = useState<Snapshot[]>([EMPTY_SNAPSHOT]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTool, setActiveToolState] = useState<ToolSlug | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const current = history[historyIndex];

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

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const wrapped = newFiles.map((file) => ({ id: makeId(), file }));
      commit({ files: [...current.files, ...wrapped], edits: current.edits });
    },
    [commit, current.files, current.edits]
  );

  const removeFiles = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      const files = current.files.filter((f) => !idSet.has(f.id));
      const edits = Object.fromEntries(Object.entries(current.edits).filter(([id]) => !idSet.has(id)));
      commit({ files, edits });
      setChecked((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
    },
    [commit, current.files, current.edits]
  );

  const reorderFiles = useCallback(
    (from: number, to: number) => {
      const files = [...current.files];
      const [moved] = files.splice(from, 1);
      files.splice(to, 0, moved);
      commit({ files, edits: current.edits });
    },
    [commit, current.files, current.edits]
  );

  const setFileEdits = useCallback(
    (id: string, edits: PageEdit[]) => {
      commit({ files: current.files, edits: { ...current.edits, [id]: edits } });
    },
    [commit, current.files, current.edits]
  );

  /** Fills in baseline edits once a file's thumbnails finish loading — updates the current snapshot in place, not a new undo step (see setFileEdits vs this). */
  const initFileEdits = useCallback(
    (id: string, edits: PageEdit[]) => {
      setHistory((prev) => {
        const next = [...prev];
        const snap = next[historyIndex];
        next[historyIndex] = { ...snap, edits: { ...snap.edits, [id]: edits } };
        return next;
      });
    },
    [historyIndex]
  );

  /** Batch tools: replace the content of specific files in place (same ids, same order), one undo step. */
  const replaceFiles = useCallback(
    (updates: { id: string; file: File }[]) => {
      const updateMap = new Map(updates.map((u) => [u.id, u.file]));
      const files = current.files.map((f) => (updateMap.has(f.id) ? { id: f.id, file: updateMap.get(f.id)! } : f));
      const edits = Object.fromEntries(Object.entries(current.edits).filter(([id]) => !updateMap.has(id)));
      commit({ files, edits });
    },
    [commit, current.files, current.edits]
  );

  /** Merge/JPG→PDF: remove the given files and insert one new combined file at that position, one undo step. */
  const replaceWithCombined = useCallback(
    (removeIds: string[], newFile: File) => {
      const idSet = new Set(removeIds);
      const index = current.files.findIndex((f) => idSet.has(f.id));
      const kept = current.files.filter((f) => !idSet.has(f.id));
      const insertAt = index === -1 ? kept.length : Math.min(index, kept.length);
      const files = [...kept.slice(0, insertAt), { id: makeId(), file: newFile }, ...kept.slice(insertAt)];
      const edits = Object.fromEntries(Object.entries(current.edits).filter(([id]) => !idSet.has(id)));
      commit({ files, edits });
      setChecked((prev) => {
        const next = new Set(prev);
        for (const id of removeIds) next.delete(id);
        return next;
      });
    },
    [commit, current.files, current.edits]
  );

  const toggleChecked = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setActiveTool = useCallback((tool: ToolSlug) => {
    setActiveToolState((prev) => (prev === tool ? null : tool));
  }, []);

  const undo = useCallback(() => setHistoryIndex((i) => Math.max(0, i - 1)), []);
  const redo = useCallback(() => setHistoryIndex((i) => Math.min(history.length - 1, i + 1)), [history.length]);

  const startOver = useCallback(() => {
    setHistory([EMPTY_SNAPSHOT]);
    setHistoryIndex(0);
    setActiveToolState(null);
    setChecked(new Set());
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
      addFiles,
      removeFiles,
      reorderFiles,
      setFileEdits,
      initFileEdits,
      replaceFiles,
      replaceWithCombined,
      toggleChecked,
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
      addFiles,
      removeFiles,
      reorderFiles,
      setFileEdits,
      initFileEdits,
      replaceFiles,
      replaceWithCombined,
      toggleChecked,
      undo,
      redo,
      startOver,
    ]
  );
}

export type Workspace = ReturnType<typeof useWorkspace>;
