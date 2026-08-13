export interface ToolMeta {
  title: string;
  description: string;
}

export const TOOLS = {
  "merge-pdf": { title: "Merge PDF", description: "Combine multiple PDFs into one file, in the order you choose." },
  "split-pdf": { title: "Split PDF", description: "Extract one or more page ranges into separate PDF files." },
  "organize-pdf": { title: "Organize PDF", description: "Reorder, delete, and rearrange the pages in a PDF." },
  "rotate-pdf": { title: "Rotate PDF", description: "Rotate every page, or just the ones you pick." },
  "compress-pdf": { title: "Compress PDF", description: "Shrink a PDF's file size by recompressing its images." },
  "pdf-to-jpg": { title: "PDF to JPG", description: "Convert every page of a PDF into a JPG image." },
  "jpg-to-pdf": { title: "JPG to PDF", description: "Combine JPG or PNG images into a single PDF." },
  "watermark-pdf": { title: "Add Watermark", description: "Stamp text over every page of a PDF." },
  "page-numbers-pdf": { title: "Add Page Numbers", description: "Number the pages of a PDF." },
  "protect-pdf": { title: "Protect PDF", description: "Add a password so only people with it can open the file." },
  "unlock-pdf": { title: "Unlock PDF", description: "Remove a password from a PDF you already know the password for." },
} as const satisfies Record<string, ToolMeta>;

export type ToolSlug = keyof typeof TOOLS;
