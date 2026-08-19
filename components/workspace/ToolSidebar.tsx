"use client";

import { TOOLS, isToolUsable, type ToolSlug } from "@/lib/tools";

interface ToolSidebarProps {
  activeTool: ToolSlug | null;
  onSelectTool: (tool: ToolSlug) => void;
  checkedFiles: File[];
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onStartOver: () => void;
  hasFiles: boolean;
}

export function ToolSidebar({
  activeTool,
  onSelectTool,
  checkedFiles,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onStartOver,
  hasFiles,
}: ToolSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo"
          className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo"
          className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          ↷
        </button>
      </div>
      {hasFiles && (
        <button
          type="button"
          onClick={onStartOver}
          className="rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Start over
        </button>
      )}

      <div className="mt-1 flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {(Object.keys(TOOLS) as ToolSlug[]).map((slug) => {
          const meta = TOOLS[slug];
          const isActive = activeTool === slug;
          const usable = hasFiles && isToolUsable(slug, checkedFiles);
          return (
            <button
              key={slug}
              type="button"
              onClick={() => onSelectTool(slug)}
              disabled={!usable}
              aria-pressed={isActive}
              title={meta.description}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40"
              style={
                isActive
                  ? { borderColor: meta.accent, backgroundColor: meta.accent, color: "#fff", transform: "scale(1.02)" }
                  : { borderColor: `${meta.accent}33`, backgroundColor: `${meta.accent}0d`, color: "#374151" }
              }
            >
              <span aria-hidden="true">{meta.icon}</span>
              <span className="truncate">{meta.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
