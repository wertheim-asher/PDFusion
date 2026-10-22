import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

type Tone = "error" | "warn" | "info" | "success";

const TONES: Record<Tone, { box: string; icon: ReactNode }> = {
  error: {
    box: "border-brand-deep bg-brand-tint text-ink",
    icon: <CircleAlert className="h-5 w-5 text-brand-deep" aria-hidden="true" />,
  },
  warn: {
    box: "border-warn bg-warn-tint text-ink",
    icon: <TriangleAlert className="h-5 w-5 text-warn" aria-hidden="true" />,
  },
  info: {
    box: "border-ink-3 bg-card text-ink",
    icon: <Info className="h-5 w-5 text-ink-2" aria-hidden="true" />,
  },
  success: {
    box: "border-ok bg-ok-tint text-ink",
    icon: <CircleCheck className="h-5 w-5 text-ok" aria-hidden="true" />,
  },
};

interface AlertProps {
  tone: Tone;
  title?: string;
  children?: ReactNode;
  /** Optional trailing controls, e.g. a "Download" button. */
  actions?: ReactNode;
  className?: string;
}

/** Inline message with an icon, so state is never conveyed by color alone. */
export function Alert({ tone, title, children, actions, className = "" }: AlertProps) {
  const t = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-[15px] leading-snug ${t.box} ${className}`}
    >
      <span className="mt-0.5 shrink-0">{t.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-display font-bold">{title}</p>}
        {children && <div className={title ? "mt-0.5 text-ink-2" : ""}>{children}</div>}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
