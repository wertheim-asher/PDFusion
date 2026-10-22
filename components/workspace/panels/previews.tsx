"use client";

import { useMemo, type ReactNode } from "react";
import type { PageNumberPosition } from "@/lib/pdf/pageNumbers";

/** US Letter in PDF points — the proportions the watermark/number previews are drawn at. */
const PAGE_W = 612;
const PAGE_H = 792;

let measureContext: CanvasRenderingContext2D | null = null;
/** Width of `text` in bold Helvetica/Arial at `size` points — matches how the watermark is positioned. */
function boldTextWidth(text: string, size: number): number {
  measureContext ??= document.createElement("canvas").getContext("2d");
  if (!measureContext) return text.length * size * 0.6;
  measureContext.font = `bold ${size}px Helvetica, Arial, sans-serif`;
  return measureContext.measureText(text).width;
}

function Frame({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <figure className="mx-auto w-44">
      {children}
      <figcaption className="mt-2 text-center text-xs font-medium text-ink-3">{caption}</figcaption>
    </figure>
  );
}

/** Stand-in page content so a preview reads as "a page", not an empty white box. */
function PlaceholderLines() {
  return (
    <>
      <rect x="60" y="70" width="280" height="22" rx="6" fill="#e5dfcf" />
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x="60" y={130 + i * 46} width={i % 5 === 4 ? 300 : 492} height="10" rx="5" fill="#efe9db" />
      ))}
    </>
  );
}

const pageClass = "w-full rounded-md bg-white ring-1 ring-line shadow-[0_3px_0_0_var(--color-line)]";

export function WatermarkPreview({
  text,
  fontSize,
  opacity,
  rotation,
}: {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
}) {
  // The library starts the text at x = (page width − text width) / 2 on the page's vertical middle,
  // then rotates around that start point — not around the text's own center. Mirror that exactly.
  const x = useMemo(() => PAGE_W / 2 - boldTextWidth(text, fontSize) / 2, [text, fontSize]);
  const y = PAGE_H / 2;
  return (
    <Frame caption="Preview">
      <svg viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} className={pageClass} role="img" aria-label="Preview of the watermark on a page">
        <PlaceholderLines />
        {text.trim() && (
          <text
            x={x}
            y={y}
            transform={`rotate(${-rotation} ${x} ${y})`}
            fontSize={fontSize}
            fontWeight={700}
            fontFamily="Helvetica, Arial, sans-serif"
            fill="#808080"
            fillOpacity={opacity}
          >
            {text}
          </text>
        )}
      </svg>
    </Frame>
  );
}

export function PageNumberPreview({
  position,
  fontSize,
  startAt,
}: {
  position: PageNumberPosition;
  fontSize: number;
  startAt: number;
}) {
  const anchor = position === "bottom-left" ? "start" : position === "bottom-right" ? "end" : "middle";
  const x = position === "bottom-left" ? 24 : position === "bottom-right" ? PAGE_W - 24 : PAGE_W / 2;
  return (
    <Frame caption="Preview of the first page">
      <svg viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} className={pageClass} role="img" aria-label="Preview of the page number position">
        <PlaceholderLines />
        <text x={x} y={PAGE_H - 12} textAnchor={anchor} fontSize={fontSize} fontFamily="Helvetica, Arial, sans-serif" fill="#000">
          {startAt}
        </text>
      </svg>
    </Frame>
  );
}

/** Margins are in millimetres; the page is drawn as A4 (210 × 297 mm). */
export function CropPreview({ top, bottom, left, right }: { top: number; bottom: number; left: number; right: number }) {
  const clamp = (n: number, max: number) => Math.min(Math.max(Number.isFinite(n) ? n : 0, 0), max);
  const l = clamp(left, 210);
  const r = clamp(right, 210);
  const t = clamp(top, 297);
  const b = clamp(bottom, 297);
  const keptW = Math.max(0, 210 - l - r);
  const keptH = Math.max(0, 297 - t - b);
  return (
    <Frame caption="What stays (white) and what's trimmed (grey)">
      <svg viewBox="0 0 210 297" className="w-full rounded-md ring-1 ring-line" role="img" aria-label="Preview of the cropped page">
        <rect width="210" height="297" fill="#d8cfbb" />
        <rect x={l} y={t} width={keptW} height={keptH} fill="#fff" stroke="#dc2626" strokeWidth="0.8" strokeDasharray="3 2" />
        <svg x={l} y={t} width={keptW} height={keptH} viewBox="0 0 210 297" preserveAspectRatio="xMidYMid slice">
          <rect x="22" y="24" width="96" height="8" rx="2" fill="#e5dfcf" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="22" y={48 + i * 18} width={i % 5 === 4 ? 110 : 166} height="4" rx="2" fill="#efe9db" />
          ))}
        </svg>
      </svg>
    </Frame>
  );
}
