# PDF Tools

Free PDF tools that run entirely in your browser — merge, split, organize, rotate, compress, convert to/from JPG, watermark, add page numbers, and password protect/unlock. Files never leave your device; there's no backend and nothing is ever uploaded.

## How it works

- [`pdf-lib`](https://pdf-lib.js.org/) handles structural edits (merge, split, organize, rotate, watermark, page numbers, image embedding).
- [`pdf.js`](https://mozilla.github.io/pdf.js/) renders pages to `<canvas>` for thumbnails and PDF→JPG/compress.
- [`mupdf`](https://mupdf.readthedocs.io/) (WebAssembly) handles password protect/unlock, since `pdf-lib` has no encryption support. Note: `mupdf` is AGPL-3.0 licensed.
- Heavy `pdf-lib`/`mupdf` work runs in a Web Worker (`workers/pdf.worker.ts`) so the UI stays responsive; `pdf.js` rendering runs on the main thread because it needs a real `<canvas>`.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Building

This is a fully static export (`output: 'export'` in `next.config.ts`) — no server, no API routes, deployable to any static host.

```bash
npm run build
```

Output goes to `out/`. Security headers (CSP, etc.) live in `public/_headers`, which Netlify applies automatically; other static hosts will need their own equivalent.
