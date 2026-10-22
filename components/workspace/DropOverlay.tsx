import { Upload } from "lucide-react";

/** Full-window cue shown while files are dragged over the page: you can drop anywhere. */
export function DropOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex animate-fade-in items-center justify-center bg-ink/55 p-6">
      <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-[2rem] border-4 border-dashed border-marker bg-ink/80 px-8 py-14 text-center text-white">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-marker text-ink">
          <Upload className="h-10 w-10" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <p className="font-display text-3xl font-extrabold">Drop to add your files</p>
        <p className="text-lg text-white/80">PDF, JPG or PNG</p>
      </div>
    </div>
  );
}
