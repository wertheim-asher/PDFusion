"use client";

import { useCallback, useMemo, useState } from "react";
import type { PageEdit } from "@/lib/pdf/organize";
import type { ToolSlug } from "@/lib/tools";

interface WorkspaceSnapshot {
  files: File[];
  /** Only meaningful when files.length === 1 (Organize/Rotate in-place editing). */
  edits: PageEdit[];
}

const EMPTY_SNAPSHOT: WorkspaceSnapshot = { files: [], edits: [] };
const MAX_HISTORY = 20;

/**
 * Central state for the single-page editor: the currently loaded file(s),
 * in-place page edits, and a linear undo/redo history over both. Every
 * "committing" action (loading/reordering files, editing pages, applying a
 * whole-doc tool) pushes a new snapshot; Split/PDF→JPG are download-only and
 * never touch this state, since they don't produce a new working document.
 */
export function useWorkspace() {
  const [history, setHistory] = useState<WorkspaceSnapshot[]>([EMPTY_SNAPSHOT]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<ToolSlug | null>(null);

  const current = history[historyIndex];

  const commit = useCallback(
    (snapshot: WorkspaceSnapshot) => {
      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndex + 1);
        const next = [...truncated, snapshot];
        return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
      });
      setHistoryIndex((prevIndex) => Math.min(prevIndex + 1, MAX_HISTORY - 1));
    },
    [historyIndex]
  );

  const setFiles = useCallback(
    (files: File[]) => {
      commit({ files, edits: [] });
    },
    [commit]
  );

  const setEdits = useCallback(
    (edits: PageEdit[]) => {
      commit({ files: current.files, edits });
    },
    [commit, current.files]
  );

  /**
   * Fills in the baseline (identity) edits once PdfPageGrid finishes loading
   * a file's thumbnails. This updates the *current* snapshot in place rather
   * than pushing a new one — it's not a user action, just data becoming
   * available, so it shouldn't be a separate undo step. (Without this, every
   * apply produces two history entries — one with edits:[] from applyResult,
   * one with the populated edits — and undo can land squarely on the
   * empty-edits one, rendering a blank page grid.)
   */
  const initEdits = useCallback(
    (edits: PageEdit[]) => {
      setHistory((prev) => {
        const next = [...prev];
        next[historyIndex] = { ...next[historyIndex], edits };
        return next;
      });
    },
    [historyIndex]
  );

  const applyResult = useCallback(
    (file: File) => {
      commit({ files: [file], edits: [] });
      setActiveTool(null);
    },
    [commit]
  );

  const undo = useCallback(() => {
    setHistoryIndex((i) => Math.max(0, i - 1));
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((i) => Math.min(history.length - 1, i + 1));
  }, [history.length]);

  const startOver = useCallback(() => {
    setHistory([EMPTY_SNAPSHOT]);
    setHistoryIndex(0);
    setActiveTool(null);
  }, []);

  return useMemo(
    () => ({
      files: current.files,
      edits: current.edits,
      activeTool,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
      setActiveTool,
      setFiles,
      setEdits,
      initEdits,
      applyResult,
      undo,
      redo,
      startOver,
    }),
    [
      current,
      activeTool,
      historyIndex,
      history.length,
      setFiles,
      setEdits,
      initEdits,
      applyResult,
      undo,
      redo,
      startOver,
    ]
  );
}

export type Workspace = ReturnType<typeof useWorkspace>;
