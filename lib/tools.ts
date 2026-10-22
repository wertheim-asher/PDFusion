export type ToolScope =
  /** Needs exactly one selected file — shows a page-level view (Organize, Rotate, Split). */
  | "single"
  /** Applies independently to every selected file (Watermark, Compress, ...). */
  | "batch"
  /** Combines every selected file into one new file (Merge, JPG→PDF). */
  | "combine";

export interface ToolMeta {
  title: string;
  description: string;
  /** Label for the tool's main action button. */
  cta: string;
  scope: ToolScope;
}

export const TOOLS = {
  "merge-pdf": {
    title: "Merge PDF",
    description: "Combine several PDFs into one file, in the order you choose.",
    cta: "Merge PDFs",
    scope: "combine",
  },
  "split-pdf": {
    title: "Split PDF",
    description: "Pull chosen pages out of a PDF into their own files.",
    cta: "Split PDF",
    scope: "single",
  },
  "organize-pdf": {
    title: "Organize pages",
    description: "Reorder, rotate, and delete the pages in a PDF.",
    cta: "Save page changes",
    scope: "single",
  },
  "rotate-pdf": {
    title: "Rotate pages",
    description: "Turn every page, or just the ones you pick.",
    cta: "Save rotation",
    scope: "single",
  },
  "compress-pdf": {
    title: "Compress PDF",
    description: "Make a PDF smaller by recompressing its images.",
    cta: "Compress",
    scope: "batch",
  },
  "crop-pdf": {
    title: "Crop margins",
    description: "Trim the white space around every page.",
    cta: "Crop PDF",
    scope: "batch",
  },
  "pdf-to-jpg": {
    title: "PDF to JPG",
    description: "Turn every page of a PDF into a JPG image.",
    cta: "Convert to JPG",
    scope: "batch",
  },
  "jpg-to-pdf": {
    title: "Images to PDF",
    description: "Put JPG or PNG images together into one PDF.",
    cta: "Convert to PDF",
    scope: "combine",
  },
  "watermark-pdf": {
    title: "Add watermark",
    description: "Stamp text across every page.",
    cta: "Add watermark",
    scope: "batch",
  },
  "page-numbers-pdf": {
    title: "Page numbers",
    description: "Number the pages of a PDF.",
    cta: "Add page numbers",
    scope: "batch",
  },
  "protect-pdf": {
    title: "Protect PDF",
    description: "Add a password, so only people who know it can open the file.",
    cta: "Protect PDF",
    scope: "batch",
  },
  "unlock-pdf": {
    title: "Unlock PDF",
    description: "Remove the password from a PDF you already have the password for.",
    cta: "Unlock PDF",
    scope: "batch",
  },
} as const satisfies Record<string, ToolMeta>;

export type ToolSlug = keyof typeof TOOLS;

/** The tool list is shown in these groups, ordered by what people are usually trying to do. */
export const TOOL_GROUPS: { label: string; tools: ToolSlug[] }[] = [
  { label: "Combine & split", tools: ["merge-pdf", "split-pdf"] },
  { label: "Edit pages", tools: ["organize-pdf", "rotate-pdf", "crop-pdf", "page-numbers-pdf", "watermark-pdf"] },
  { label: "Convert", tools: ["pdf-to-jpg", "jpg-to-pdf"] },
  { label: "Size & security", tools: ["compress-pdf", "protect-pdf", "unlock-pdf"] },
];

/** Files among `files` that this tool actually operates on (PDFs, except JPG→PDF which wants images). */
export function matchingFiles(tool: ToolSlug, files: File[]): File[] {
  const needsImages = tool === "jpg-to-pdf";
  return files.filter((f) => (needsImages ? f.type.startsWith("image/") : f.type === "application/pdf"));
}

/** Single source of truth for both flagging a tool as unavailable and gating its panel. */
export function isToolUsable(tool: ToolSlug, selectedFiles: File[]): boolean {
  const matching = matchingFiles(tool, selectedFiles);
  const scope = TOOLS[tool].scope;
  if (scope === "single") return matching.length === 1;
  if (tool === "merge-pdf") return matching.length >= 2;
  return matching.length >= 1;
}

/** Short label for what a tool needs, shown next to it while it's unavailable. */
export function toolRequirement(tool: ToolSlug): string {
  if (TOOLS[tool].scope === "single") return "1 PDF";
  if (tool === "merge-pdf") return "2+ PDFs";
  if (tool === "jpg-to-pdf") return "Images";
  return "PDF";
}

/** Full sentence for the options panel when the current selection doesn't fit the tool. */
export function toolUnavailableHint(tool: ToolSlug): string {
  const meta = TOOLS[tool];
  if (meta.scope === "single") return `${meta.title} works on one PDF at a time. Select exactly one PDF.`;
  if (tool === "merge-pdf") return "Merging needs at least two PDFs. Select two or more.";
  if (tool === "jpg-to-pdf") return "Select at least one JPG or PNG image to turn into a PDF.";
  return `Select at least one PDF to use ${meta.title}.`;
}
