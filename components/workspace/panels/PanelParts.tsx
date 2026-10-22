"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

const VISIBLE_CHIPS = 5;

/** Which files the tool is about to act on — so "selected" is never something you have to remember. */
export function AppliesTo({ files }: { files: { file: File }[] }) {
  const shown = files.slice(0, VISIBLE_CHIPS);
  const extra = files.length - shown.length;
  return (
    <div>
      <p className="mb-1.5 font-display text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
        {files.length === 1 ? "Applies to" : `Applies to ${files.length} files`}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {shown.map((wf, i) => (
          <li
            key={`${wf.file.name}-${i}`}
            title={wf.file.name}
            className="max-w-full truncate rounded-lg border-2 border-line bg-paper px-2.5 py-1 text-sm font-medium text-ink"
          >
            {wf.file.name}
          </li>
        ))}
        {extra > 0 && <li className="rounded-lg px-2 py-1 text-sm font-medium text-ink-3">+{extra} more</li>}
      </ul>
    </div>
  );
}

interface PrimaryActionProps {
  label: string;
  status: "idle" | "working" | "done" | "error";
  onClick: () => void;
  disabled?: boolean;
  workingLabel?: string;
  doneLabel?: string;
  icon?: ReactNode;
}

/** The one big button on every panel. Same size, place and behavior everywhere. */
export function PrimaryAction({
  label,
  status,
  onClick,
  disabled,
  workingLabel = "Working…",
  doneLabel = "Done",
  icon,
}: PrimaryActionProps) {
  const done = status === "done";
  return (
    <Button
      variant="primary"
      size="lg"
      className={`w-full ${done ? "!bg-ok" : ""}`}
      loading={status === "working"}
      disabled={disabled}
      onClick={onClick}
      icon={done ? <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" /> : icon}
    >
      {status === "working" ? workingLabel : done ? doneLabel : label}
    </Button>
  );
}

/** A failed attempt: say what happened, and reassure that nothing was lost. */
export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert tone="error" title="That didn't work">
      {message} Your original files haven&apos;t been changed.
    </Alert>
  );
}

/** Shown beside a disabled button so it's clear what's missing, rather than leaving it to guesswork. */
export function WhyDisabled({ children }: { children: ReactNode }) {
  return <p className="text-center text-sm font-medium text-ink-2">{children}</p>;
}
