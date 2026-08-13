import * as mupdf from "mupdf";
import { assertSafePassword } from "./errors";

export interface ProtectOptions {
  /** Required to open the document. */
  userPassword: string;
  /** Required to change permissions/encryption. Defaults to userPassword. */
  ownerPassword?: string;
}

export async function protectPdf(bytes: Uint8Array, options: ProtectOptions): Promise<Uint8Array> {
  const userPassword = options.userPassword;
  const ownerPassword = options.ownerPassword || options.userPassword;
  assertSafePassword(userPassword);
  assertSafePassword(ownerPassword);
  if (!userPassword) {
    throw new Error("A password is required to protect this PDF.");
  }

  const doc = new mupdf.PDFDocument(bytes);
  const out = doc.saveToBuffer({
    encrypt: "aes-256",
    "owner-password": ownerPassword,
    "user-password": userPassword,
  });
  return out.asUint8Array();
}
