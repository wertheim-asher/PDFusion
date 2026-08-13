"use client";

import { ToolShell } from "@/components/ToolShell";
import { usePdfWorker } from "@/hooks/usePdfWorker";
import { assertSafePassword } from "@/lib/pdf/errors";
import { TOOLS } from "@/lib/tools";

interface Options {
  password: string;
  confirmPassword: string;
}

export function ProtectTool() {
  const { runJob } = usePdfWorker();

  return (
    <ToolShell<Options>
      title={TOOLS["protect-pdf"].title}
      description={TOOLS["protect-pdf"].description}
      accept="application/pdf"
      dropzoneLabel="Select a PDF file or drop it here"
      initialOptions={{ password: "", confirmPassword: "" }}
      processLabel="Protect PDF"
      renderOptions={({ options, setOptions }) => (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={options.password}
              onChange={(e) => setOptions({ ...options, password: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              value={options.confirmPassword}
              onChange={(e) => setOptions({ ...options, confirmPassword: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <p className="text-xs text-gray-500">Passwords can&apos;t contain a comma.</p>
        </div>
      )}
      onProcess={async (files, options) => {
        if (!options.password) {
          throw new Error("Enter a password.");
        }
        if (options.password !== options.confirmPassword) {
          throw new Error("Passwords don't match.");
        }
        assertSafePassword(options.password);
        const bytes = await files[0].arrayBuffer();
        const result = await runJob({
          type: "protect",
          bytes,
          options: { userPassword: options.password },
        });
        return { filename: result.filename, blob: new Blob([result.bytes], { type: "application/pdf" }) };
      }}
    />
  );
}
