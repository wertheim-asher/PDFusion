// Browser-only stub for Node's built-in "module" package. mupdf's WASM
// loader statically imports "module" to get createRequire() for its
// Node.js code path, guarded behind a `typeof process` check that's always
// false in the browser — so this stub is never actually called, it just
// needs to exist so Turbopack/webpack can resolve the import.
export function createRequire(): () => never {
  return () => {
    throw new Error("createRequire() is not available in the browser.");
  };
}
