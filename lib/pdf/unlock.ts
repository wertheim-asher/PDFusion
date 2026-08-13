import * as mupdf from "mupdf";
import { assertSafePassword, WrongPasswordError } from "./errors";

export async function unlockPdf(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  assertSafePassword(password);

  const doc = new mupdf.PDFDocument(bytes);
  if (doc.needsPassword()) {
    const authResult = doc.authenticatePassword(password);
    if (authResult === 0) {
      throw new WrongPasswordError();
    }
  }
  const out = doc.saveToBuffer({ encrypt: "none" });
  return out.asUint8Array();
}
