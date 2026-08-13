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
