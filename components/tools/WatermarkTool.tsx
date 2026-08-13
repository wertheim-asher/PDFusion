"use client";

import { ToolShell } from "@/components/ToolShell";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import type { WatermarkOptions } from "@/lib/pdf/watermark";
import { TOOLS } from "@/lib/tools";

export function WatermarkTool() {
  const { runJob } = usePdfWorker();

  return (
    <ToolShell<WatermarkOptions>
      title={TOOLS["watermark-pdf"].title}
      description={TOOLS["watermark-pdf"].description}
      accept="application/pdf"
      dropzoneLabel="Select a PDF file or drop it here"
      initialOptions={{ text: "CONFIDENTIAL", fontSize: 48, opacity: 0.3, rotationDegrees: 45 }}
      processLabel="Add Watermark"
      renderOptions={({ options, setOptions }) => (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Watermark text</label>
            <input
              type="text"
              value={options.text}
              onChange={(e) => setOptions({ ...options, text: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Font size</label>
              <input
                type="number"
                min={8}
                max={200}
                value={options.fontSize}
                onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Opacity</label>
              <input
                type="number"
                min={0.05}
                max={1}
                step={0.05}
                value={options.opacity}
                onChange={(e) => setOptions({ ...options, opacity: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rotation °</label>
              <input
                type="number"
                min={-90}
                max={90}
                value={options.rotationDegrees}
                onChange={(e) => setOptions({ ...options, rotationDegrees: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
      onProcess={async (files, options) => {
        const bytes = await files[0].arrayBuffer();
        const result = await runJob({ type: "watermark", bytes, options });
        return { filename: result.filename, blob: new Blob([result.bytes], { type: "application/pdf" }) };
      }}
    />
  );
}
