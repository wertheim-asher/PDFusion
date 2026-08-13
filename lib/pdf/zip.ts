import JSZip from "jszip";

export async function zipFiles(files: { filename: string; bytes: Uint8Array }[]): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.filename, f.bytes);
  }
  return zip.generateAsync({ type: "uint8array" });
}
