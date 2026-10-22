import { Upload, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

const STEPS = [
  { title: "Add your files", body: "PDFs, JPGs or PNGs. They open right here — nothing is uploaded." },
  { title: "Pick a tool", body: "Choose from the list. Tools you can't use yet tell you what they need." },
  { title: "Save the result", body: "Download one file or a zip, or keep working and combine more tools." },
];

/** First-run view: one obvious thing to do, and a three-step picture of what comes next. */
export function EmptyState({ onOpenPicker }: { onOpenPicker: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 py-4 lg:py-8">
      <section className="flex flex-col items-center rounded-3xl border-2 border-dashed border-ink-3 bg-card/80 px-6 py-12 text-center">
        <svg viewBox="0 0 28 28" className="h-24 w-24 -rotate-6" aria-hidden="true">
          <rect x="3" y="7" width="15" height="19" rx="3" fill="#FCA5A5" />
          <rect x="10" y="2" width="15" height="19" rx="3" fill="#DC2626" />
          <path d="M14.5 9.5h6M14.5 13h6M14.5 16.5h3.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <h2 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl">
          Fix up your PDFs.
          <br />
          <span className="text-brand">Keep them private.</span>
        </h2>
        <p className="mt-4 max-w-md text-lg text-ink-2">
          Merge, split, compress, convert and more — all done on your own device, so your files never leave it.
        </p>
        <Button
          size="lg"
          variant="primary"
          icon={<Upload className="h-6 w-6" aria-hidden="true" />}
          onClick={onOpenPicker}
          className="mt-8"
        >
          Choose files
        </Button>
        <p className="mt-4 text-[15px] text-ink-3">or drag PDF, JPG or PNG files onto this page</p>
      </section>

      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-2xl border-2 border-line bg-card p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-marker font-display text-lg font-extrabold text-ink">
              {i + 1}
            </span>
            <h3 className="mt-3 font-display text-lg font-bold text-ink">{step.title}</h3>
            <p className="mt-1 text-[15px] leading-snug text-ink-2">{step.body}</p>
          </li>
        ))}
      </ol>

      <p className="flex items-center justify-center gap-2 text-center text-[15px] text-ink-2">
        <ShieldCheck className="h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
        No account and no upload. Your files are processed in this window and never leave your device.
      </p>
    </div>
  );
}
