"use client";

import { ToolShell } from "@/components/ToolShell";
import { compressPdf, type CompressLevel } from "@/lib/pdf/compress";
import { bytesToBlob } from "@/lib/pdf/bytes";
import { TOOLS } from "@/lib/tools";

interface Options {
  level: CompressLevel;
}

export function CompressTool() {
  return (
    <ToolShell<Options>
      title={TOOLS["compress-pdf"].title}
      description={TOOLS["compress-pdf"].description}
      accept="application/pdf"
      dropzoneLabel="Select a PDF file or drop it here"
      initialOptions={{ level: "medium" }}
      processLabel="Compress PDF"
      renderOptions={({ options, setOptions }) => (
        <div>
          <label className="block text-sm font-medium text-gray-700">Compression level</label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setOptions({ level })}
                className={`rounded-lg border px-3 py-2 text-sm capitalize ${
                  options.level === level
                    ? "border-red-600 bg-red-50 text-red-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {level === "low" ? "Smallest file" : level === "high" ? "Best quality" : "Balanced"}
              </button>
            ))}
          </div>
        </div>
      )}
      onProcess={async (files, options) => {
        const bytes = await compressPdf(files[0], options.level);
        return { filename: "compressed.pdf", blob: bytesToBlob(bytes, "application/pdf") };
      }}
    />
  );
}
