"use client";

import { DownloadPanel } from "./DownloadPanel";
import { plural } from "@/lib/files";
import { TOOLS } from "@/lib/tools";
import type { PageRange } from "@/lib/pdf/split";
import type { PdfJob } from "@/lib/pdf/jobs";

interface SplitPanelProps {
  file: File;
  /** 0-indexed original page numbers, sorted ascending. */
  selection: number[];
  runJob: (job: PdfJob) => Promise<{ filename: string; bytes: ArrayBuffer }>;
}

/** Groups sorted 0-indexed page numbers into contiguous 1-indexed ranges. */
function toRanges(selection: number[]): PageRange[] {
  const ranges: PageRange[] = [];
  for (const zeroIndexed of selection) {
    const page = zeroIndexed + 1;
    const last = ranges[ranges.length - 1];
    if (last && page === last.to + 1) {
      last.to = page;
    } else {
      ranges.push({ from: page, to: page });
    }
  }
  return ranges;
}

export function SplitPanel({ file, selection, runJob }: SplitPanelProps) {
  const ranges = toRanges(selection);

  return (
    <DownloadPanel
      applyLabel={TOOLS["split-pdf"].cta}
      applyDisabled={ranges.length === 0}
      disabledHint="Click at least one page first."
      run={async () => {
        const bytes = await file.arrayBuffer();
        const result = await runJob({ type: "split", bytes, ranges });
        const isZip = result.filename.endsWith(".zip");
        return {
          filename: result.filename,
          blob: new Blob([result.bytes], { type: isZip ? "application/zip" : "application/pdf" }),
        };
      }}
    >
      {ranges.length === 0 ? (
        <p className="text-[15px] text-ink-2">
          Click the pages you want to pull out of <strong className="font-semibold text-ink">{file.name}</strong>. They
          open in the middle of the screen.
        </p>
      ) : (
        <div>
          <p className="mb-2 text-[15px] text-ink-2">
            {plural(selection.length, "page")} selected. You&apos;ll get {plural(ranges.length, "file")}:
          </p>
          <ul className="space-y-1.5">
            {ranges.map((r) => (
              <li key={r.from} className="rounded-xl border-2 border-line bg-paper px-3 py-2 text-[15px] font-medium text-ink">
                {r.from === r.to ? `Page ${r.from}` : `Pages ${r.from}–${r.to}`}
              </li>
            ))}
          </ul>
          {ranges.length > 1 && <p className="mt-2 text-sm text-ink-3">Several files are bundled into one zip.</p>}
        </div>
      )}
    </DownloadPanel>
  );
}
