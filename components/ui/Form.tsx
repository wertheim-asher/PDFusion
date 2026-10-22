"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputBase =
  "h-12 w-full rounded-xl border-2 border-line bg-card px-4 text-base text-ink placeholder:text-ink-3 transition-colors hover:border-ink-3 focus:border-ink focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-brand-deep";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  /** Rendered at the end of the label row, e.g. the current value of a slider. */
  value?: ReactNode;
  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode;
}

/** Label + control + hint/error, wired together with proper ids for screen readers. */
export function Field({ label, hint, error, value, children }: FieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const hasNote = Boolean(hint || error);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-display text-[15px] font-bold text-ink">
          {label}
        </label>
        {value !== undefined && <span className="font-display text-[15px] font-bold tabular-nums text-ink-2">{value}</span>}
      </div>
      {children({ id, describedBy: hasNote ? noteId : undefined })}
      {error ? (
        <p id={noteId} className="mt-1.5 text-sm font-medium text-brand-deep">
          {error}
        </p>
      ) : hint ? (
        <p id={noteId} className="mt-1.5 text-sm text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className = "", ...rest },
  ref
) {
  return <input ref={ref} className={`${inputBase} ${className}`} {...rest} />;
});

/** Password field with a show/hide toggle, so typos are catchable before they lock someone out of their own file. */
export const PasswordInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PasswordInput(
  { className = "", ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        autoComplete="off"
        spellCheck={false}
        className={`${inputBase} pr-14 ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
      >
        {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
      </button>
    </div>
  );
});

interface SliderProps {
  id?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  "aria-describedby"?: string;
}

export function Slider({ min, max, step = 1, value, onChange, ...rest }: SliderProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className="slider"
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ "--fill": `${fill}%` } as React.CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
      {...rest}
    />
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "row" lays options side by side; "stack" gives each a full-width row with its description. */
  layout?: "row" | "stack";
}

/** Radio group styled as big tappable cards — far easier to hit and read than a <select>. */
export function Segmented<T extends string>({ label, options, value, onChange, layout = "row" }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={layout === "row" ? "grid grid-flow-col auto-cols-fr gap-2" : "flex flex-col gap-2"}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`flex min-h-14 items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left transition-[background-color,border-color,box-shadow] ${
              layout === "row" ? "flex-col justify-center text-center" : ""
            } ${
              selected
                ? "border-ink bg-brand-tint shadow-[0_3px_0_0_var(--color-ink)]"
                : "border-line bg-card hover:border-ink-3"
            }`}
          >
            {opt.icon && <span className={selected ? "text-brand-deep" : "text-ink-2"}>{opt.icon}</span>}
            <span className="min-w-0">
              <span className="block font-display text-[15px] font-bold leading-tight text-ink">{opt.label}</span>
              {opt.description && <span className="mt-0.5 block text-sm leading-snug text-ink-2">{opt.description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
