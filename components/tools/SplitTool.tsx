"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolShell } from "@/components/ToolShell";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import { parseRanges } from "@/lib/pdf/split";
import { TOOLS } from "@/lib/tools";

interface Options {
  ranges: string;
}

export function SplitTool() {
  const { runJob } = usePdfWorker();

  return (
    <ToolShell<Options>
      title={TOOLS["split-pdf"].title}
      description={TOOLS["split-pdf"].description}
      accept="application/pdf"
      dropzoneLabel="Select a PDF file or drop it here"
      initialOptions={{ ranges: "" }}
      processLabel="Split PDF"
      renderOptions={({ files, options, setOptions }) => (
        <SplitOptions files={files} options={options} setOptions={setOptions} />
      )}
      onProcess={async (files, options) => {
        const bytes = await files[0].arrayBuffer();
        const count = (await PDFDocument.load(bytes)).getPageCount();
        const ranges = parseRanges(options.ranges, count);
        const result = await runJob({ type: "split", bytes, ranges });
        const isZip = result.filename.endsWith(".zip");
        return {
          filename: result.filename,
          blob: new Blob([result.bytes], { type: isZip ? "application/zip" : "application/pdf" }),
        };
      }}
    />
  );
}

function SplitOptions({
  files,
  options,
  setOptions,
}: {
  files: File[];
  options: Options;
  setOptions: (o: Options) => void;
}) {
  const [pageCount, setPageCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Clears the stale count from the previous file while the new one loads,
    // not state derived from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPageCount(null);
    (async () => {
      const bytes = await files[0].arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      if (!cancelled) {
        setPageCount(doc.getPageCount());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  return (
    <div className="space-y-2">
      <label htmlFor="ranges" className="block text-sm font-medium text-gray-700">
        Page ranges{pageCount ? ` (this PDF has ${pageCount} pages)` : ""}
      </label>
      <input
        id="ranges"
        type="text"
        value={options.ranges}
        onChange={(e) => setOptions({ ranges: e.target.value })}
        placeholder="e.g. 1-3, 5, 8-10"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
      />
      <p className="text-xs text-gray-500">
        Each range becomes its own PDF. Multiple ranges are bundled into a zip file.
      </p>
    </div>
  );
}
