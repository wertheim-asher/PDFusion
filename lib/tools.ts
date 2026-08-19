export type ToolScope =
  /** Needs exactly one checked file — shows a page-level view (Organize, Rotate, Split). */
  | "single"
  /** Applies independently to every checked file (Watermark, Compress, ...). */
  | "batch"
  /** Combines every checked file into one new file (Merge, JPG→PDF). */
  | "combine";

export interface ToolMeta {
  title: string;
  description: string;
  scope: ToolScope;
  /**
   * Hex accent color for this tool's button/badge. Concrete hex rather than a
   * Tailwind color name because Tailwind can't generate classes from a
   * dynamically-built string like `bg-${color}-600` — this gets applied via
   * inline style instead.
   */
  accent: string;
  icon: string;
}

export const TOOLS = {
  "merge-pdf": {
    title: "Merge PDF",
    description: "Combine multiple PDFs into one file, in the order you choose.",
    scope: "combine",
    accent: "#4f46e5",
    icon: "🔀",
  },
  "split-pdf": {
    title: "Split PDF",
    description: "Extract one or more page ranges into separate PDF files.",
    scope: "single",
    accent: "#ea580c",
    icon: "✂️",
  },
  "organize-pdf": {
    title: "Organize PDF",
    description: "Reorder, delete, and rearrange the pages in a PDF.",
    scope: "single",
    accent: "#0d9488",
    icon: "🗂️",
  },
  "rotate-pdf": {
    title: "Rotate PDF",
    description: "Rotate every page, or just the ones you pick.",
    scope: "single",
    accent: "#0284c7",
    icon: "🔄",
  },
  "compress-pdf": {
    title: "Compress PDF",
    description: "Shrink a PDF's file size by recompressing its images.",
    scope: "batch",
    accent: "#9333ea",
    icon: "🗜️",
  },
  "crop-pdf": {
    title: "Crop PDF",
    description: "Trim the margins on every page of a PDF.",
    scope: "batch",
    accent: "#65a30d",
    icon: "🔲",
  },
  "pdf-to-jpg": {
    title: "PDF to JPG",
    description: "Convert every page of a PDF into a JPG image.",
    scope: "batch",
    accent: "#db2777",
    icon: "🖼️",
  },
  "jpg-to-pdf": {
    title: "JPG to PDF",
    description: "Combine JPG or PNG images into a single PDF.",
    scope: "combine",
    accent: "#0891b2",
    icon: "📄",
  },
  "watermark-pdf": {
    title: "Add Watermark",
    description: "Stamp text over every page of a PDF.",
    scope: "batch",
    accent: "#2563eb",
    icon: "💧",
  },
  "page-numbers-pdf": {
    title: "Add Page Numbers",
    description: "Number the pages of a PDF.",
    scope: "batch",
    accent: "#d97706",
    icon: "#️⃣",
  },
  "protect-pdf": {
    title: "Protect PDF",
    description: "Add a password so only people with it can open the file.",
    scope: "batch",
    accent: "#e11d48",
    icon: "🔒",
  },
  "unlock-pdf": {
    title: "Unlock PDF",
    description: "Remove a password from a PDF you already know the password for.",
    scope: "batch",
    accent: "#16a34a",
    icon: "🔓",
  },
} as const satisfies Record<string, ToolMeta>;

export type ToolSlug = keyof typeof TOOLS;
