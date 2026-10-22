/** MIME types the workspace can open, keyed by the extensions we'll trust when the OS gives a file no type. */
const TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export const ACCEPT_ATTR = "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png";

export type FileKind = "pdf" | "image";

export function fileKind(file: File): FileKind {
  return file.type === "application/pdf" ? "pdf" : "image";
}

function resolveType(file: File): string | null {
  if (Object.values(TYPE_BY_EXTENSION).includes(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return TYPE_BY_EXTENSION[ext] ?? null;
}

/**
 * Splits dropped/picked files into ones the tools can handle and ones they
 * can't. Dropping bypasses the file picker's `accept` filter, so without this
 * a stray .docx would land in the workspace as a broken card. Files whose type
 * the OS left blank are re-wrapped with the right one, since every tool keys
 * off `file.type`.
 */
export function splitAcceptedFiles(files: File[]): { accepted: File[]; rejected: File[] } {
  const accepted: File[] = [];
  const rejected: File[] = [];
  for (const file of files) {
    const type = resolveType(file);
    if (!type) rejected.push(file);
    else accepted.push(file.type === type ? file : new File([file], file.name, { type, lastModified: file.lastModified }));
  }
  return { accepted, rejected };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
