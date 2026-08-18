"use client";

import { FileDropzone } from "@/components/FileDropzone";
import { compressPdf, type CompressLevel } from "@/lib/pdf/compress";
import type { CropOptions } from "@/lib/pdf/crop";
import { bytesToFile } from "@/lib/pdf/bytes";
import { assertSafePassword } from "@/lib/pdf/errors";
import type { WatermarkOptions } from "@/lib/pdf/watermark";
import type { PageNumberOptions } from "@/lib/pdf/pageNumbers";
import type { PageEdit } from "@/lib/pdf/organize";
import type { PdfJob, PdfJobResult } from "@/lib/pdf/jobs";
import { TOOLS, type ToolSlug } from "@/lib/tools";
import { WholeDocPanel } from "./panels/WholeDocPanel";
import { OrganizeRotatePanel } from "./panels/OrganizeRotatePanel";
import { SplitPanel } from "./panels/SplitPanel";
import { PdfToJpgPanel } from "./panels/PdfToJpgPanel";
import { MergePanel } from "./panels/MergePanel";
import { JpgToPdfPanel } from "./panels/JpgToPdfPanel";

interface ToolPanelProps {
  tool: ToolSlug;
  files: File[];
  edits: PageEdit[];
  splitSelection: number[];
  runJob: (job: PdfJob) => Promise<PdfJobResult>;
  onApply: (file: File) => void;
  onRequestFiles: (files: File[]) => void;
}

const numberInput =
  "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none";
const label = "block text-sm font-medium text-gray-700";

export function ToolPanel({ tool, files, edits, splitSelection, runJob, onApply, onRequestFiles }: ToolPanelProps) {
  const needsImages = tool === "jpg-to-pdf";
  const filesMatch =
    files.length > 0 && files.every((f) => (needsImages ? f.type.startsWith("image/") : f.type === "application/pdf"));

  if (!filesMatch) {
    return (
      <FileDropzone
        accept={needsImages ? "image/jpeg,image/png" : "application/pdf"}
        multiple={tool === "merge-pdf" || tool === "jpg-to-pdf"}
        label={needsImages ? "Select images or drop them here" : "Select a PDF file or drop it here"}
        hint={tool === "merge-pdf" ? "Choose two or more files." : undefined}
        onFiles={onRequestFiles}
      />
    );
  }

  const file = files[0];

  switch (tool) {
    case "merge-pdf":
      return <MergePanel files={files} runJob={runJob} onApply={onApply} />;

    case "jpg-to-pdf":
      return <JpgToPdfPanel files={files} runJob={runJob} onApply={onApply} />;

    case "organize-pdf":
      return <OrganizeRotatePanel file={file} edits={edits} restricted={false} runJob={runJob} onApply={onApply} />;

    case "rotate-pdf":
      return <OrganizeRotatePanel file={file} edits={edits} restricted={true} runJob={runJob} onApply={onApply} />;

    case "split-pdf":
      return <SplitPanel file={file} selection={splitSelection} runJob={runJob} />;

    case "pdf-to-jpg":
      return <PdfToJpgPanel file={file} />;

    case "compress-pdf":
      return (
        <WholeDocPanel<{ level: CompressLevel }>
          file={file}
          initialOptions={{ level: "medium" }}
          applyLabel={TOOLS["compress-pdf"].title}
          run={async (f, options) => bytesToFile(await compressPdf(f, options.level), "compressed.pdf", "application/pdf")}
          onApply={onApply}
          renderFields={({ options, setOptions }) => (
            <div>
              <label className={label}>Compression level</label>
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
        />
      );

    case "watermark-pdf":
      return (
        <WholeDocPanel<WatermarkOptions>
          file={file}
          initialOptions={{ text: "CONFIDENTIAL", fontSize: 48, opacity: 0.3, rotationDegrees: 45 }}
          applyLabel="Add Watermark"
          onApply={onApply}
          run={async (f, options) => {
            const bytes = await f.arrayBuffer();
            const result = await runJob({ type: "watermark", bytes, options });
            return bytesToFile(new Uint8Array(result.bytes), result.filename, "application/pdf");
          }}
          renderFields={({ options, setOptions }) => (
            <div className="space-y-4">
              <div>
                <label className={label}>Watermark text</label>
                <input
                  type="text"
                  value={options.text}
                  onChange={(e) => setOptions({ ...options, text: e.target.value })}
                  className={numberInput}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={label}>Font size</label>
                  <input
                    type="number"
                    min={8}
                    max={200}
                    value={options.fontSize}
                    onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}
                    className={numberInput}
                  />
                </div>
                <div>
                  <label className={label}>Opacity</label>
                  <input
                    type="number"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={options.opacity}
                    onChange={(e) => setOptions({ ...options, opacity: Number(e.target.value) })}
                    className={numberInput}
                  />
                </div>
                <div>
                  <label className={label}>Rotation °</label>
                  <input
                    type="number"
                    min={-90}
                    max={90}
                    value={options.rotationDegrees}
                    onChange={(e) => setOptions({ ...options, rotationDegrees: Number(e.target.value) })}
                    className={numberInput}
                  />
                </div>
              </div>
            </div>
          )}
        />
      );

    case "page-numbers-pdf":
      return (
        <WholeDocPanel<PageNumberOptions>
          file={file}
          initialOptions={{ startAt: 1, position: "bottom-center", fontSize: 12 }}
          applyLabel="Add Page Numbers"
          onApply={onApply}
          run={async (f, options) => {
            const bytes = await f.arrayBuffer();
            const result = await runJob({ type: "pageNumbers", bytes, options });
            return bytesToFile(new Uint8Array(result.bytes), result.filename, "application/pdf");
          }}
          renderFields={({ options, setOptions }) => (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={label}>Start at</label>
                <input
                  type="number"
                  min={0}
                  value={options.startAt}
                  onChange={(e) => setOptions({ ...options, startAt: Number(e.target.value) })}
                  className={numberInput}
                />
              </div>
              <div>
                <label className={label}>Position</label>
                <select
                  value={options.position}
                  onChange={(e) => setOptions({ ...options, position: e.target.value as PageNumberOptions["position"] })}
                  className={numberInput}
                >
                  <option value="bottom-left">Bottom left</option>
                  <option value="bottom-center">Bottom center</option>
                  <option value="bottom-right">Bottom right</option>
                </select>
              </div>
              <div>
                <label className={label}>Font size</label>
                <input
                  type="number"
                  min={6}
                  max={48}
                  value={options.fontSize}
                  onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}
                  className={numberInput}
                />
              </div>
            </div>
          )}
        />
      );

    case "crop-pdf":
      return (
        <WholeDocPanel<CropOptions>
          file={file}
          initialOptions={{ top: 36, bottom: 36, left: 36, right: 36 }}
          applyLabel="Crop PDF"
          onApply={onApply}
          run={async (f, options) => {
            const bytes = await f.arrayBuffer();
            const result = await runJob({ type: "crop", bytes, options });
            return bytesToFile(new Uint8Array(result.bytes), result.filename, "application/pdf");
          }}
          renderFields={({ options, setOptions }) => (
            <div className="space-y-2">
              <label className={label}>Margins to trim (points, 72pt = 1in)</label>
              <div className="grid grid-cols-4 gap-4">
                {(["top", "bottom", "left", "right"] as const).map((side) => (
                  <div key={side}>
                    <label className="block text-xs text-gray-500 capitalize">{side}</label>
                    <input
                      type="number"
                      min={0}
                      value={options[side]}
                      onChange={(e) => setOptions({ ...options, [side]: Number(e.target.value) })}
                      className={numberInput}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        />
      );

    case "protect-pdf":
      return (
        <WholeDocPanel<{ password: string; confirmPassword: string }>
          file={file}
          initialOptions={{ password: "", confirmPassword: "" }}
          applyLabel="Protect PDF"
          onApply={onApply}
          run={async (f, options) => {
            if (!options.password) throw new Error("Enter a password.");
            if (options.password !== options.confirmPassword) throw new Error("Passwords don't match.");
            assertSafePassword(options.password);
            const bytes = await f.arrayBuffer();
            const result = await runJob({ type: "protect", bytes, options: { userPassword: options.password } });
            return bytesToFile(new Uint8Array(result.bytes), result.filename, "application/pdf");
          }}
          renderFields={({ options, setOptions }) => (
            <div className="space-y-4">
              <div>
                <label className={label}>Password</label>
                <input
                  type="password"
                  value={options.password}
                  onChange={(e) => setOptions({ ...options, password: e.target.value })}
                  className={numberInput}
                />
              </div>
              <div>
                <label className={label}>Confirm password</label>
                <input
                  type="password"
                  value={options.confirmPassword}
                  onChange={(e) => setOptions({ ...options, confirmPassword: e.target.value })}
                  className={numberInput}
                />
              </div>
              <p className="text-xs text-gray-500">Passwords can&apos;t contain a comma.</p>
            </div>
          )}
        />
      );

    case "unlock-pdf":
      return (
        <WholeDocPanel<{ password: string }>
          file={file}
          initialOptions={{ password: "" }}
          applyLabel="Unlock PDF"
          onApply={onApply}
          run={async (f, options) => {
            if (!options.password) throw new Error("Enter the PDF's current password.");
            assertSafePassword(options.password);
            const bytes = await f.arrayBuffer();
            const result = await runJob({ type: "unlock", bytes, password: options.password });
            return bytesToFile(new Uint8Array(result.bytes), result.filename, "application/pdf");
          }}
          renderFields={({ options, setOptions }) => (
            <div>
              <label className={label}>Current password</label>
              <input
                type="password"
                value={options.password}
                onChange={(e) => setOptions({ password: e.target.value })}
                className={numberInput}
              />
            </div>
          )}
        />
      );
  }
}
