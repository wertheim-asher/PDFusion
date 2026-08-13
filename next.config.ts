import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site — no server logic anywhere (no API routes, no server
  // actions, no dynamic rendering), so `output: 'export'` lets it be hosted
  // on any static host (Netlify, GitHub Pages, Cloudflare Pages, ...) with
  // no serverless/edge runtime required. Security headers live in
  // public/_headers (Netlify's format) instead of next.config's headers()
  // function, which static export doesn't support.
  output: "export",
  turbopack: {
    resolveAlias: {
      // mupdf's WASM loader statically imports Node's "module" builtin
      // (guarded at runtime, never actually called in the browser) purely
      // to get createRequire() for its server code path. Point the browser
      // build at a no-op stub so Turbopack can resolve it.
      module: { browser: "./lib/shims/empty-module.ts" },
    },
  },
};

export default nextConfig;
