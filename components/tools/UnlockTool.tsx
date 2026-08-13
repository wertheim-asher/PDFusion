"use client";

import { ToolShell } from "@/components/ToolShell";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import { assertSafePassword } from "@/lib/pdf/errors";
import { TOOLS } from "@/lib/tools";

interface Options {
  password: string;
}

export function UnlockTool() {
  const { runJob } = usePdfWorker();

  return (
    <ToolShell<Options>
      title={TOOLS["unlock-pdf"].title}
      description={TOOLS["unlock-pdf"].description}
      accept="application/pdf"
      dropzoneLabel="Select a PDF file or drop it here"
      initialOptions={{ password: "" }}
      processLabel="Unlock PDF"
      renderOptions={({ options, setOptions }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700">Current password</label>
          <input
            type="password"
            value={options.password}
            onChange={(e) => setOptions({ ...options, password: e.target.value })}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
        </div>
      )}
      onProcess={async (files, options) => {
        if (!options.password) {
          throw new Error("Enter the PDF's current password.");
        }
        assertSafePassword(options.password);
        const bytes = await files[0].arrayBuffer();
        const result = await runJob({ type: "unlock", bytes, password: options.password });
        return { filename: result.filename, blob: new Blob([result.bytes], { type: "application/pdf" }) };
      }}
    />
  );
}
