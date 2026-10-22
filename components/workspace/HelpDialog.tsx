"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

const STEPS = [
  ["Add your files", "Drop PDFs, JPGs or PNGs anywhere on the page, or press “Add files”. New files start out selected."],
  ["Pick a tool", "Choose one from the list on the left. If it can't be used with your current selection, it tells you what it needs."],
  ["Adjust and apply", "Set the options on the right, then press the big red button. You'll see what happened, and you can undo it."],
  ["Save", "Use “Download” on a file, or select several and download them together as a zip."],
];

function Key({ children }: { children: string }) {
  return (
    <kbd className="rounded-md border-2 border-line bg-paper px-2 py-0.5 font-display text-sm font-bold text-ink shadow-[0_2px_0_0_var(--color-line)]">
      {children}
    </kbd>
  );
}

/** On-demand help: how the app works, and the keyboard shortcuts. Escape or a click outside closes it. */
export function HelpDialog({ mod, onClose }: { mod: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shortcuts: [string, string[]][] = [
    ["Add files", [`${mod}O`]],
    ["Select all files", [`${mod}A`]],
    ["Undo", [`${mod}Z`]],
    ["Redo", [`${mod}Shift+Z`]],
    ["Delete selected files", ["Delete"]],
    ["Show this help", ["?"]],
  ];

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center overflow-y-auto bg-ink/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="my-auto w-full max-w-lg animate-card-in rounded-3xl border-2 border-ink bg-card p-6 shadow-[0_8px_0_0_var(--color-ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="help-title" className="font-display text-2xl font-extrabold text-ink">
          How PDFusion works
        </h2>

        <ol className="mt-4 space-y-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-marker font-display text-base font-extrabold text-ink">
                {i + 1}
              </span>
              <p className="text-[15px] leading-snug text-ink-2">
                <strong className="font-display font-bold text-ink">{title}.</strong> {body}
              </p>
            </li>
          ))}
        </ol>

        <h3 className="mt-6 font-display text-xs font-bold uppercase tracking-[0.14em] text-ink-3">Keyboard shortcuts</h3>
        <dl className="mt-2 divide-y divide-line rounded-xl border-2 border-line">
          {shortcuts.map(([action, keys]) => (
            <div key={action} className="flex items-center justify-between gap-3 px-3 py-2">
              <dt className="text-[15px] text-ink-2">{action}</dt>
              <dd className="flex gap-1">
                {keys.map((k) => (
                  <Key key={k}>{k}</Key>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 flex items-start gap-2 text-[15px] leading-snug text-ink-2">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
          Everything happens on your device. Your files are never uploaded anywhere.
        </p>

        <div className="mt-6 flex justify-end">
          <Button ref={closeRef} variant="primary" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
