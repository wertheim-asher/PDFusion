"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";

type Tone = "success" | "info" | "warn" | "error";

export interface ToastData {
  id: number;
  tone: Tone;
  message: string;
  action?: { label: string; onClick: () => void };
}

/** One toast at a time: a new message replaces the previous one instead of stacking up. */
export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const nextId = useRef(0);

  const show = useCallback((message: string, opts?: { tone?: Tone; action?: ToastData["action"] }) => {
    nextId.current += 1;
    setToast({ id: nextId.current, tone: opts?.tone ?? "success", message, action: opts?.action });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, show, dismiss };
}

const ICONS: Record<Tone, React.ReactNode> = {
  success: <CircleCheck className="h-5 w-5 text-[#6ee7a8]" aria-hidden="true" />,
  info: <Info className="h-5 w-5 text-[#9ac7ff]" aria-hidden="true" />,
  warn: <TriangleAlert className="h-5 w-5 text-marker" aria-hidden="true" />,
  error: <CircleAlert className="h-5 w-5 text-[#ff9b8f]" aria-hidden="true" />,
};

export function ToastHost({ toast, onDismiss }: { toast: ToastData | null; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!toast || paused) return;
    const timer = setTimeout(onDismiss, toast.tone === "error" || toast.action ? 12000 : 6000);
    return () => clearTimeout(timer);
  }, [toast, paused, onDismiss]);

  return (
    // Below the modal dialogs (z-50) so a toast can never cover a dialog's buttons.
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      {toast && (
        <div
          key={toast.id}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className="pointer-events-auto flex max-w-xl animate-toast-in items-center gap-3 rounded-2xl border-2 border-ink bg-ink py-2.5 pl-4 pr-2 text-white shadow-[0_6px_0_0_rgba(28,26,21,0.25)]"
        >
          {ICONS[toast.tone]}
          <p className="min-w-0 flex-1 py-1 text-[15px] font-medium leading-snug">{toast.message}</p>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="shrink-0 rounded-lg bg-marker px-3.5 py-2 font-display text-sm font-bold text-ink transition-colors hover:bg-white"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
