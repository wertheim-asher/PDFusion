"use client";

import { useRef, useState } from "react";

interface FileTrayProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept: string;
  addLabel: string;
  /** Multi-file tools (Merge, JPG→PDF) allow reordering + adding more; single-file tools just get a remove/replace control. */
  multiple?: boolean;
}

export function FileTray({ files, onFilesChange, accept, addLabel, multiple = true }: FileTrayProps) {
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [addDragOver, setAddDragOver] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  const removeAt = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const addFiles = (newFiles: FileList | File[] | null) => {
    if (!newFiles || newFiles.length === 0) return;
    onFilesChange([...files, ...Array.from(newFiles)]);
  };

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null || from === targetIndex) return;
    const next = [...files];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    onFilesChange(next);
  };

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {files.map((f, i) => (
          <li
            key={`${f.name}-${f.size}-${i}`}
            draggable={multiple && files.length > 1}
            onDragStart={() => (dragIndex.current = i)}
            onDragOver={(e) => {
              e.preventDefault();
              if (multiple) setDragOverIndex(i);
            }}
            onDragLeave={() => setDragOverIndex((prev) => (prev === i ? null : prev))}
            onDrop={() => handleDrop(i)}
            onDragEnd={() => {
              dragIndex.current = null;
              setDragOverIndex(null);
            }}
            className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition-all duration-150 ${
              dragOverIndex === i ? "border-red-400 -translate-y-0.5 shadow-md" : "border-gray-200"
            } ${multiple && files.length > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
          >
            {multiple && files.length > 1 && (
              <span className="text-gray-300 select-none" aria-hidden="true">
                ⠿
              </span>
            )}
            <span className="flex-1 truncate text-gray-700">{f.name}</span>
            <span className="shrink-0 text-gray-400">{formatBytes(f.size)}</span>
            <button
              type="button"
              aria-label={`Remove ${f.name}`}
              onClick={() => removeAt(i)}
              className="shrink-0 text-gray-400 hover:text-red-600"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div
        role="button"
        tabIndex={0}
        onClick={() => addInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") addInputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setAddDragOver(true);
        }}
        onDragLeave={() => setAddDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setAddDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-3 py-2 text-center text-sm transition-colors ${
          addDragOver ? "border-red-400 bg-red-50 text-red-600" : "border-gray-300 text-gray-500 hover:border-gray-400"
        }`}
      >
        + {addLabel}
        <input
          ref={addInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
