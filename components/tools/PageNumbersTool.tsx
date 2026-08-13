"use client";

import { ToolShell } from "@/components/ToolShell";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import type { PageNumberOptions } from "@/lib/pdf/pageNumbers";
import { TOOLS } from "@/lib/tools";

export function PageNumbersTool() {
  const { runJob } = usePdfWorker();

  return (
    <ToolShell<PageNumberOptions>
      title={TOOLS["page-numbers-pdf"].title}
      description={TOOLS["page-numbers-pdf"].description}
      accept="application/pdf"
      dropzoneLabel="Select a PDF file or drop it here"
      initialOptions={{ startAt: 1, position: "bottom-center", fontSize: 12 }}
      processLabel="Add Page Numbers"
      renderOptions={({ options, setOptions }) => (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start at</label>
            <input
              type="number"
              min={0}
              value={options.startAt}
              onChange={(e) => setOptions({ ...options, startAt: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <select
              value={options.position}
              onChange={(e) =>
                setOptions({ ...options, position: e.target.value as PageNumberOptions["position"] })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            >
              <option value="bottom-left">Bottom left</option>
              <option value="bottom-center">Bottom center</option>
              <option value="bottom-right">Bottom right</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Font size</label>
            <input
              type="number"
              min={6}
              max={48}
              value={options.fontSize}
              onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
      )}
      onProcess={async (files, options) => {
        const bytes = await files[0].arrayBuffer();
        const result = await runJob({ type: "pageNumbers", bytes, options });
        return { filename: result.filename, blob: new Blob([result.bytes], { type: "application/pdf" }) };
      }}
    />
  );
}
