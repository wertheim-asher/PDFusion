# PDF Tools

Free PDF tools that run entirely in your browser — merge, split, organize, rotate, compress, convert to/from JPG, watermark, add page numbers, and password protect/unlock. Files never leave your device; there's no backend and nothing is ever uploaded.

## How it works

- [`pdf-lib`](https://pdf-lib.js.org/) handles structural edits (merge, split, organize, rotate, watermark, page numbers, image embedding).
- [`pdf.js`](https://mozilla.github.io/pdf.js/) renders pages to `<canvas>` for thumbnails and PDF→JPG/compress.
- [`mupdf`](https://mupdf.readthedocs.io/) (WebAssembly) handles password protect/unlock, since `pdf-lib` has no encryption support. Note: `mupdf` is AGPL-3.0 licensed.
- Heavy `pdf-lib`/`mupdf` work runs in a Web Worker (`workers/pdf.worker.ts`) so the UI stays responsive; `pdf.js` rendering runs on the main thread because it needs a real `<canvas>`.

## Design

The look is "paper and ink": a warm paper background, near-black ink for structure and text, and the logo's red as the single action color. Fonts (Bricolage Grotesque and Figtree) are self-hosted by `next/font`, so the browser never contacts a third party. Design tokens live in `app/globals.css`; shared building blocks (Button, Alert, form fields, Toast) are in `components/ui/`. Interactive targets are at least 40px tall, and primary actions are 56px — new UI should keep to that.

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

## Desktop app (Tauri)

The static export is also packaged as a native desktop app via [Tauri](https://tauri.app/) (config in `src-tauri/`). Requires the Rust toolchain (and on Windows, the MSVC C++ build tools).

```bash
npm run tauri dev     # live-reloading desktop window against `next dev`
npm run tauri build   # production build: runs `npm run build`, then bundles installers
```

`tauri build` outputs to `src-tauri/target/release/`:
- `app.exe` — the raw executable
- `bundle/msi/PDF Tool_<version>_x64_en-US.msi`
- `bundle/nsis/PDF Tool_<version>_x64-setup.exe`

App icon source is `components/Logo.tsx`'s mark; regenerate the icon set with `npx tauri icon <path-to-1024x1024-png>` if the logo changes.

### Desktop-specific behavior

The UI is identical to the web app, but the webview underneath differs, so a few things are handled on the Rust side (`src-tauri/`):

- **Downloads.** The main window is created in `src-tauri/src/lib.rs` (its entry in `tauri.conf.json` has `"create": false`) with a download handler. macOS's WebKit view *cancels every download* unless one is registered, so without it "Download" would silently do nothing there. Files are saved to the user's Downloads folder (existing names get ` (1)`, ` (2)`…). The webview shows no download UI of its own, so the page raises a toast when a download starts.
- **File drops.** `dragDropEnabled` is `false` so the page's own drag-and-drop works on Windows; otherwise Tauri intercepts OS file drops.
- **Window size.** The minimum width (1024px) matches the three-column layout's breakpoint, so the desktop app never falls into the stacked small-screen layout.

### Staying in sync with the web app

The desktop app has no separate UI code — it bundles the exact same `out/` static export used by the web deploy. There is one source of truth: `app/`, `components/`, `lib/`. Any change made there applies to both automatically once each side rebuilds; there's nothing to keep in sync by hand.

- **Web app**: Netlify auto-deploys on every push to `main` (see `netlify.toml`).
- **Desktop app**: [`.github/workflows/build-desktop.yml`](.github/workflows/build-desktop.yml) auto-builds Windows + macOS installers on every push to `main` and publishes them to a rolling [`latest-build` release](https://github.com/wertheim-asher/PDFusion/releases/tag/latest-build) — always the current state of `main`, no manual rebuild needed.
  - macOS builds are ad-hoc signed (not notarized — no Apple Developer account configured), so first launch requires right-click → Open to bypass Gatekeeper.
  - Trigger a build manually from the Actions tab (`workflow_dispatch`) if needed.

### Windows vs macOS: single-file vs app bundle

Windows has a true portable single-file exe (`app.exe`/the NSIS-installed exe) — no install step needed, just run it. macOS has no equivalent: the unit macOS actually runs is always an `.app` bundle (a folder Finder displays as one icon). There's no way to collapse that into one flat file and keep it a working GUI app.

The release publishes two ways to get the macOS app, both no-install in the sense of "no admin prompts, no system changes":
- `*-macos.app.zip` — unzip (Finder does this on double-click), then double-click the `.app`. Closest thing to the Windows single-file experience.
- `.dmg` — mount, drag to Applications. The more familiar convention for most Mac users.
