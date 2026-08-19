"use client";

import { DownloadPanel } from "./DownloadPanel";
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
  const summary =
    ranges.length === 0
      ? `Click pages on ${file.name} in the file list to choose which ones to extract.`
      : `${selection.length} page${selection.length === 1 ? "" : "s"} selected → ${ranges.length} file${
          ranges.length === 1 ? "" : "s"
        }.`;

  return (
    <DownloadPanel
      applyLabel="Split PDF"
      applyDisabled={ranges.length === 0}
      disabledHint="Select at least one page first."
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
      <p className="text-sm text-gray-500">{summary}</p>
      <p className="text-xs text-gray-400">
        Each contiguous run of selected pages becomes its own PDF; multiple files are bundled into a zip.
      </p>
    </DownloadPanel>
  );
}
