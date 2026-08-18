"use client";

import { TOOLS, type ToolSlug } from "@/lib/tools";

interface ToolbarProps {
  activeTool: ToolSlug | null;
  onSelectTool: (tool: ToolSlug) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onStartOver: () => void;
  hasFiles: boolean;
}

export function Toolbar({
  activeTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onStartOver,
  hasFiles,
}: ToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-500">Tools</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo"
            className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ↶ Undo
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo"
            className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            Redo ↷
          </button>
          {hasFiles && (
            <button
              type="button"
              onClick={onStartOver}
              className="ml-2 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Start over
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TOOLS) as ToolSlug[]).map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => onSelectTool(slug)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              activeTool === slug
                ? "border-red-600 bg-red-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {TOOLS[slug].title}
          </button>
        ))}
      </div>
    </div>
  );
}
