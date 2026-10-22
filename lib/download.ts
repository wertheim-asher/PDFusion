import JSZip from "jszip";

/**
 * The one place the app hands bytes to the user. Keeping it central means any
 * platform-specific saving (e.g. a native save dialog in the desktop app) only
 * has to be added here.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers; give it a moment to start.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** One file downloads as itself; several are bundled into a single zip (duplicate names get " (2)", " (3)"…). */
export async function downloadFiles(files: File[], zipName = "files.zip"): Promise<void> {
  if (files.length === 1) {
    saveBlob(files[0], files[0].name);
    return;
  }
  const zip = new JSZip();
  const usedNames = new Set<string>();
  for (const file of files) {
    let name = file.name;
    let i = 2;
    while (usedNames.has(name)) {
      name = file.name.replace(/(\.[^.]+)?$/, (ext) => ` (${i})${ext}`);
      i++;
    }
    usedNames.add(name);
    zip.file(name, file);
  }
  saveBlob(await zip.generateAsync({ type: "blob" }), zipName);
}
