"use client";

import { AlignCenter, AlignLeft, AlignRight, Plus } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, PasswordInput, Segmented, Slider, TextInput } from "@/components/ui/Form";
import { compressPdf, type CompressLevel } from "@/lib/pdf/compress";
import type { CropOptions } from "@/lib/pdf/crop";
import { bytesToFile } from "@/lib/pdf/bytes";
import { assertSafePassword } from "@/lib/pdf/errors";
import type { WatermarkOptions } from "@/lib/pdf/watermark";
import type { PageNumberOptions } from "@/lib/pdf/pageNumbers";
import type { PageEdit } from "@/lib/pdf/organize";
import type { PdfJob, PdfJobResult } from "@/lib/pdf/jobs";
import type { ImageInput } from "@/lib/pdf/imagesToPdf";
import type { WorkspaceFile } from "@/hooks/useWorkspace";
import { formatBytes, plural, renamePdf } from "@/lib/files";
import { TOOLS, type ToolSlug, isToolUsable, matchingFiles, toolUnavailableHint } from "@/lib/tools";
import { WholeDocPanel, type WholeDocResult } from "./panels/WholeDocPanel";
import { OrganizeRotatePanel } from "./panels/OrganizeRotatePanel";
import { SplitPanel } from "./panels/SplitPanel";
import { PdfToJpgPanel } from "./panels/PdfToJpgPanel";
import { CombinePanel } from "./panels/CombinePanel";
import { CropPreview, PageNumberPreview, WatermarkPreview } from "./panels/previews";

interface ToolPanelProps {
  tool: ToolSlug;
  files: WorkspaceFile[];
  checkedIds: ReadonlySet<string>;
  edits: Record<string, PageEdit[]>;
  /** Page count of each PDF as first loaded, by file id. */
  pageCounts: Record<string, number>;
  splitSelection: number[];
  runJob: (job: PdfJob) => Promise<PdfJobResult>;
  onApplyBatch: (updates: { id: string; file: File }[], summary: string) => void;
  onApplyCombine: (removeIds: string[], newFile: File, summary: string) => void;
  onSelectOnly: (id: string) => void;
  onMoveFile: (id: string, direction: -1 | 1) => void;
  onAddFiles: () => void;
}

const MM_TO_PT = 72 / 25.4;

/** "Compressed “a.pdf”." for one file, "Compressed 3 files." for several. */
function simpleSummary(verb: string) {
  return (results: WholeDocResult[]) =>
    results.length === 1 ? `${verb} “${results[0].name}”.` : `${verb} ${plural(results.length, "file")}.`;
}

function compressSummary(results: WholeDocResult[]): string {
  const before = results.reduce((sum, r) => sum + r.before, 0);
  const after = results.reduce((sum, r) => sum + r.after, 0);
  const subject = results.length === 1 ? `“${results[0].name}”` : plural(results.length, "file");
  if (after >= before) return `${subject} ${results.length === 1 ? "is" : "are"} already as small as can be — nothing to shrink.`;
  const saved = Math.round((1 - after / before) * 100);
  return `Compressed ${subject}: ${formatBytes(before)} → ${formatBytes(after)} (${saved}% smaller).`;
}

export function ToolPanel({
  tool,
  files,
  checkedIds,
  edits,
  pageCounts,
  splitSelection,
  runJob,
  onApplyBatch,
  onApplyCombine,
  onSelectOnly,
  onMoveFile,
  onAddFiles,
}: ToolPanelProps) {
  const selected = files.filter((f) => checkedIds.has(f.id));
  const matching = selected.filter((f) => matchingFiles(tool, [f.file]).length > 0);

  if (files.length === 0) {
    return (
      <div className="space-y-4">
        <Alert tone="info" title="Add a file first">
          {tool === "jpg-to-pdf" ? "Add one or more JPG or PNG images to get started." : "Add a PDF to use this tool."}
        </Alert>
        <Button variant="primary" className="w-full" icon={<Plus className="h-5 w-5" aria-hidden="true" />} onClick={onAddFiles}>
          Add files
        </Button>
      </div>
    );
  }

  if (!isToolUsable(tool, selected.map((f) => f.file))) {
    return (
      <div className="space-y-4">
        <Alert tone="info" title="Select the right files">
          {toolUnavailableHint(tool)}
        </Alert>
        {TOOLS[tool].scope === "single" && matching.length > 1 && (
          <div>
            <p className="mb-2 font-display text-sm font-bold text-ink">Or just use one of your selected files:</p>
            <ul className="space-y-2">
              {matching.map((wf) => (
                <li key={wf.id}>
                  <Button className="w-full !justify-start" onClick={() => onSelectOnly(wf.id)}>
                    <span className="truncate">{wf.file.name}</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button icon={<Plus className="h-5 w-5" aria-hidden="true" />} className="w-full" onClick={onAddFiles}>
          Add files
        </Button>
      </div>
    );
  }

  const pdfJob = async (f: File, job: (bytes: ArrayBuffer) => PdfJob, suffix: string): Promise<File> => {
    const result = await runJob(job(await f.arrayBuffer()));
    return bytesToFile(new Uint8Array(result.bytes), renamePdf(f.name, suffix), "application/pdf");
  };

  switch (tool) {
    case "merge-pdf":
      return (
        <CombinePanel
          files={matching}
          intro="Your PDFs will be joined in this order. Use the arrows to change it."
          cta={TOOLS["merge-pdf"].cta}
          run={async (list) => runJob({ type: "merge", bytesList: await Promise.all(list.map((wf) => wf.file.arrayBuffer())) })}
          onApply={onApplyCombine}
          onMove={onMoveFile}
          summarize={(count, name) => `Merged ${plural(count, "PDF")} into “${name}”.`}
        />
      );

    case "jpg-to-pdf":
      return (
        <CombinePanel
          files={matching}
          intro="Each image becomes a page, in this order. Use the arrows to change it."
          cta={TOOLS["jpg-to-pdf"].cta}
          run={async (list) => {
            const images: ImageInput[] = await Promise.all(
              list.map(async (wf) => ({
                bytes: await wf.file.arrayBuffer(),
                type: wf.file.type === "image/png" ? ("image/png" as const) : ("image/jpeg" as const),
              }))
            );
            return runJob({ type: "imagesToPdf", images });
          }}
          onApply={onApplyCombine}
          onMove={onMoveFile}
          summarize={(count, name) => `Turned ${plural(count, "image")} into “${name}”.`}
        />
      );

    case "organize-pdf":
    case "rotate-pdf":
      return (
        <OrganizeRotatePanel
          file={matching[0]}
          edits={edits[matching[0].id] ?? []}
          pageCount={pageCounts[matching[0].id]}
          restricted={tool === "rotate-pdf"}
          runJob={runJob}
          onApply={onApplyBatch}
        />
      );

    case "split-pdf":
      return <SplitPanel file={matching[0].file} selection={splitSelection} runJob={runJob} />;

    case "pdf-to-jpg":
      return <PdfToJpgPanel files={matching} />;

    case "compress-pdf":
      return (
        <WholeDocPanel<{ level: CompressLevel }>
          files={matching}
          initialOptions={{ level: "medium" }}
          applyLabel={TOOLS["compress-pdf"].cta}
          doneLabel="Compressed"
          summarize={compressSummary}
          onApply={onApplyBatch}
          run={async (f, options) => {
            const bytes = await compressPdf(f, options.level);
            // Nothing gained: leave the file exactly as it is rather than swapping in a copy.
            if (bytes.byteLength >= f.size) return f;
            return bytesToFile(bytes, renamePdf(f.name, "-compressed"), "application/pdf");
          }}
          renderFields={({ options, setOptions }) => (
            <div className="space-y-4">
              <div>
                <p className="mb-2 font-display text-[15px] font-bold text-ink">How much to shrink it</p>
                <Segmented<CompressLevel>
                  label="Compression level"
                  layout="stack"
                  value={options.level}
                  onChange={(level) => setOptions({ level })}
                  options={[
                    { value: "low", label: "Smallest file", description: "Strongest squeeze. Images look softer." },
                    { value: "medium", label: "Balanced", description: "A good mix of size and quality." },
                    { value: "high", label: "Best quality", description: "Gentler squeeze. Images stay sharp." },
                  ]}
                />
              </div>
              <Alert tone="info">
                Compressing turns each page into a picture, so text on the page can no longer be selected or searched.
                It works best on scans and image-heavy PDFs.
              </Alert>
            </div>
          )}
        />
      );

    case "watermark-pdf":
      return (
        <WholeDocPanel<WatermarkOptions>
          files={matching}
          initialOptions={{ text: "CONFIDENTIAL", fontSize: 48, opacity: 0.3, rotationDegrees: 45 }}
          applyLabel={TOOLS["watermark-pdf"].cta}
          doneLabel="Added"
          summarize={simpleSummary("Added a watermark to")}
          onApply={onApplyBatch}
          blockedReason={(o) => (o.text.trim() ? null : "Type the text to stamp on every page.")}
          run={(f, options) => pdfJob(f, (bytes) => ({ type: "watermark", bytes, options }), "-watermarked")}
          renderFields={({ options, setOptions }) => (
            <div className="space-y-5">
              <WatermarkPreview
                text={options.text}
                fontSize={options.fontSize}
                opacity={options.opacity}
                rotation={options.rotationDegrees}
              />
              <Field label="Watermark text">
                {({ id, describedBy }) => (
                  <TextInput
                    id={id}
                    aria-describedby={describedBy}
                    type="text"
                    value={options.text}
                    onChange={(e) => setOptions({ ...options, text: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Size" value={`${options.fontSize} pt`}>
                {({ id }) => (
                  <Slider id={id} min={12} max={150} value={options.fontSize} onChange={(fontSize) => setOptions({ ...options, fontSize })} />
                )}
              </Field>
              <Field label="Strength" value={`${Math.round(options.opacity * 100)}%`}>
                {({ id }) => (
                  <Slider
                    id={id}
                    min={5}
                    max={100}
                    step={5}
                    value={Math.round(options.opacity * 100)}
                    onChange={(pct) => setOptions({ ...options, opacity: pct / 100 })}
                  />
                )}
              </Field>
              <Field label="Angle" value={`${options.rotationDegrees}°`}>
                {({ id }) => (
                  <Slider
                    id={id}
                    min={-90}
                    max={90}
                    step={5}
                    value={options.rotationDegrees}
                    onChange={(rotationDegrees) => setOptions({ ...options, rotationDegrees })}
                  />
                )}
              </Field>
            </div>
          )}
        />
      );

    case "page-numbers-pdf":
      return (
        <WholeDocPanel<PageNumberOptions>
          files={matching}
          initialOptions={{ startAt: 1, position: "bottom-center", fontSize: 12 }}
          applyLabel={TOOLS["page-numbers-pdf"].cta}
          doneLabel="Numbered"
          summarize={simpleSummary("Numbered the pages of")}
          onApply={onApplyBatch}
          run={(f, options) => pdfJob(f, (bytes) => ({ type: "pageNumbers", bytes, options }), "-numbered")}
          renderFields={({ options, setOptions }) => (
            <div className="space-y-5">
              <PageNumberPreview position={options.position} fontSize={options.fontSize} startAt={options.startAt} />
              <div>
                <p className="mb-2 font-display text-[15px] font-bold text-ink">Where on the page</p>
                <Segmented<PageNumberOptions["position"]>
                  label="Position"
                  value={options.position}
                  onChange={(position) => setOptions({ ...options, position })}
                  options={[
                    { value: "bottom-left", label: "Left", icon: <AlignLeft className="h-5 w-5" aria-hidden="true" /> },
                    { value: "bottom-center", label: "Center", icon: <AlignCenter className="h-5 w-5" aria-hidden="true" /> },
                    { value: "bottom-right", label: "Right", icon: <AlignRight className="h-5 w-5" aria-hidden="true" /> },
                  ]}
                />
              </div>
              <Field label="Start counting at" hint="The first page gets this number.">
                {({ id, describedBy }) => (
                  <TextInput
                    id={id}
                    aria-describedby={describedBy}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={options.startAt}
                    onChange={(e) => setOptions({ ...options, startAt: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                  />
                )}
              </Field>
              <Field label="Number size" value={`${options.fontSize} pt`}>
                {({ id }) => (
                  <Slider id={id} min={6} max={48} value={options.fontSize} onChange={(fontSize) => setOptions({ ...options, fontSize })} />
                )}
              </Field>
            </div>
          )}
        />
      );

    case "crop-pdf":
      // Margins are entered in millimetres (people don't think in PDF points) and converted when applied.
      return (
        <WholeDocPanel<CropOptions>
          files={matching}
          initialOptions={{ top: 10, bottom: 10, left: 10, right: 10 }}
          applyLabel={TOOLS["crop-pdf"].cta}
          doneLabel="Cropped"
          summarize={simpleSummary("Cropped")}
          onApply={onApplyBatch}
          run={(f, options) =>
            pdfJob(
              f,
              (bytes) => ({
                type: "crop",
                bytes,
                options: {
                  top: options.top * MM_TO_PT,
                  bottom: options.bottom * MM_TO_PT,
                  left: options.left * MM_TO_PT,
                  right: options.right * MM_TO_PT,
                },
              }),
              "-cropped"
            )
          }
          renderFields={({ options, setOptions }) => (
            <div className="space-y-5">
              <CropPreview {...options} />
              <div>
                <p className="mb-2 font-display text-[15px] font-bold text-ink">How much to trim (mm)</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["top", "bottom", "left", "right"] as const).map((side) => (
                    <Field key={side} label={side[0].toUpperCase() + side.slice(1)}>
                      {({ id }) => (
                        <TextInput
                          id={id}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step={1}
                          value={options[side]}
                          onChange={(e) => setOptions({ ...options, [side]: Math.max(0, Number(e.target.value) || 0) })}
                        />
                      )}
                    </Field>
                  ))}
                </div>
              </div>
            </div>
          )}
        />
      );

    case "protect-pdf":
      return (
        <WholeDocPanel<{ password: string; confirmPassword: string }>
          files={matching}
          initialOptions={{ password: "", confirmPassword: "" }}
          applyLabel={TOOLS["protect-pdf"].cta}
          doneLabel="Protected"
          summarize={simpleSummary("Protected")}
          onApply={onApplyBatch}
          blockedReason={(o) => {
            if (!o.password) return "Choose a password to continue.";
            if (o.password.includes(",")) return "Fix the password above to continue.";
            if (o.password !== o.confirmPassword) return "Both passwords need to match to continue.";
            return null;
          }}
          run={async (f, options) => {
            if (!options.password) throw new Error("Enter a password.");
            if (options.password !== options.confirmPassword) throw new Error("Passwords don't match.");
            assertSafePassword(options.password);
            return pdfJob(f, (bytes) => ({ type: "protect", bytes, options: { userPassword: options.password } }), "-protected");
          }}
          renderFields={({ options, setOptions }) => (
            <div className="space-y-5">
              <Field
                label="Password"
                error={options.password.includes(",") ? "Passwords can't contain a comma. Please remove it." : null}
              >
                {({ id, describedBy }) => (
                  <PasswordInput
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={options.password.includes(",") || undefined}
                    value={options.password}
                    onChange={(e) => setOptions({ ...options, password: e.target.value })}
                  />
                )}
              </Field>
              <Field
                label="Type it again"
                error={options.confirmPassword && options.confirmPassword !== options.password ? "That doesn't match yet." : null}
              >
                {({ id, describedBy }) => (
                  <PasswordInput
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={(options.confirmPassword && options.confirmPassword !== options.password) || undefined}
                    value={options.confirmPassword}
                    onChange={(e) => setOptions({ ...options, confirmPassword: e.target.value })}
                  />
                )}
              </Field>
              <Alert tone="warn" title="Don't lose it">
                There&apos;s no way to recover a forgotten password — not even by us. Keep it somewhere safe.
              </Alert>
            </div>
          )}
        />
      );

    case "unlock-pdf":
      return (
        <WholeDocPanel<{ password: string }>
          files={matching}
          initialOptions={{ password: "" }}
          applyLabel={TOOLS["unlock-pdf"].cta}
          doneLabel="Unlocked"
          summarize={simpleSummary("Unlocked")}
          onApply={onApplyBatch}
          blockedReason={(o) => (o.password ? null : "Enter the PDF's current password to continue.")}
          run={async (f, options) => {
            if (!options.password) throw new Error("Enter the PDF's current password.");
            assertSafePassword(options.password);
            return pdfJob(f, (bytes) => ({ type: "unlock", bytes, password: options.password }), "-unlocked");
          }}
          renderFields={({ options, setOptions }) => (
            <Field label="Current password" hint="The password this PDF currently asks for when you open it.">
              {({ id, describedBy }) => (
                <PasswordInput
                  id={id}
                  aria-describedby={describedBy}
                  value={options.password}
                  onChange={(e) => setOptions({ password: e.target.value })}
                />
              )}
            </Field>
          )}
        />
      );
  }
}
