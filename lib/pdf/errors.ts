export class PdfToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfToolError";
  }
}

export class InvalidPasswordError extends PdfToolError {
  constructor(message = "The password contains a character that isn't supported (comma). Please choose a different password.") {
    super(message);
    this.name = "InvalidPasswordError";
  }
}

export class WrongPasswordError extends PdfToolError {
  constructor(message = "That password doesn't unlock this PDF.") {
    super(message);
    this.name = "WrongPasswordError";
  }
}

// mupdf's PDF option-string parser splits on "," with no escaping, so a
// password containing a comma gets silently rewritten (e.g. "a,b" -> "a:b")
// instead of erroring. Reject commas up front rather than risk setting a
// password that's different from what the user typed.
export function assertSafePassword(password: string): void {
  if (password.includes(",")) {
    throw new InvalidPasswordError();
  }
}

/**
 * Turns whatever a tool threw into something a non-technical person can act
 * on. Errors we raise ourselves are already plain English and pass through;
 * the opaque ones come from the PDF libraries.
 */
export function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof PdfToolError) return message;
  if (/encrypt|password/i.test(message)) {
    return "This PDF is password-protected. Use “Unlock PDF” on it first, then try again.";
  }
  if (/failed to parse|no pdf header|invalid pdf|xref|unexpected token/i.test(message)) {
    return "This file doesn't look like a valid PDF, or it's damaged.";
  }
  if (/memory|allocation|too large/i.test(message)) {
    return "Your device ran out of memory. Try a smaller file, or process fewer files at once.";
  }
  return message || "Something went wrong.";
}
