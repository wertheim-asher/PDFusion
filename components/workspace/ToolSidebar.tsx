"use client";

import { Lock } from "lucide-react";
import { ToolIcon } from "@/components/ToolIcon";
import { TOOLS, TOOL_GROUPS, isToolUsable, toolRequirement, toolUnavailableHint, type ToolSlug } from "@/lib/tools";

interface ToolSidebarProps {
  activeTool: ToolSlug | null;
  onSelectTool: (tool: ToolSlug) => void;
  selectedFiles: File[];
  hasFiles: boolean;
}

export function ToolSidebar({ activeTool, onSelectTool, selectedFiles, hasFiles }: ToolSidebarProps) {
  return (
    <nav aria-label="Tools" className="flex flex-col gap-6 p-4">
      <h2 className="px-1 font-display text-xl font-extrabold leading-tight text-ink">What do you want to do?</h2>

      {TOOL_GROUPS.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h3 className="mb-2 px-1 font-display text-xs font-bold uppercase tracking-[0.14em] text-ink-3">{group.label}</h3>
          <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
            {group.tools.map((slug) => {
              const meta = TOOLS[slug];
              const isActive = activeTool === slug;
              // Before any file is added nothing is "locked" — the list is just a menu of what's possible.
              const locked = hasFiles && !isToolUsable(slug, selectedFiles);
              return (
                <li key={slug}>
                  <button
                    type="button"
                    onClick={() => onSelectTool(slug)}
                    aria-pressed={isActive}
                    title={locked ? toolUnavailableHint(slug) : meta.description}
                    className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow,color] duration-100 ${
                      isActive
                        ? "border-ink bg-ink text-white shadow-[0_3px_0_0_var(--color-brand)]"
                        : "border-transparent hover:border-ink-3 hover:bg-paper"
                    } ${locked && !isActive ? "text-ink-3" : isActive ? "" : "text-ink"}`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        isActive ? "bg-brand text-white" : locked ? "bg-paper text-ink-3" : "bg-paper-2 text-ink"
                      }`}
                    >
                      <ToolIcon tool={slug} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[15px] font-bold leading-tight">{meta.title}</span>
                      {locked && (
                        <span
                          className={`mt-0.5 flex items-center gap-1 text-xs font-semibold ${isActive ? "text-white/75" : "text-ink-3"}`}
                        >
                          <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
                          Needs {toolRequirement(slug)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
