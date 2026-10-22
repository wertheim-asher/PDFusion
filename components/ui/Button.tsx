import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-display font-semibold transition-[transform,box-shadow,background-color,color,border-color] duration-100 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-2 border-ink bg-brand text-white shadow-[0_4px_0_0_var(--color-ink)] hover:bg-brand-deep active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--color-ink)] disabled:border-line disabled:bg-paper-2 disabled:text-ink-3 disabled:shadow-none disabled:hover:bg-paper-2 disabled:active:translate-y-0",
  secondary:
    "border-2 border-ink bg-card text-ink shadow-[0_3px_0_0_var(--color-ink)] hover:bg-paper active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--color-ink)] disabled:border-line disabled:text-ink-3 disabled:shadow-none disabled:hover:bg-card disabled:active:translate-y-0",
  ghost:
    "border-2 border-transparent text-ink-2 hover:bg-paper-2 hover:text-ink disabled:text-ink-3 disabled:opacity-60 disabled:hover:bg-transparent",
  danger:
    "border-2 border-brand-deep bg-card text-brand-deep shadow-[0_3px_0_0_var(--color-brand-deep)] hover:bg-brand-tint active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--color-brand-deep)] disabled:border-line disabled:text-ink-3 disabled:shadow-none disabled:hover:bg-card disabled:active:translate-y-0",
};

const sizes: Record<ButtonSize, { text: string; icon: string }> = {
  sm: { text: "min-h-10 rounded-lg px-3 text-sm", icon: "h-10 w-10 rounded-lg text-sm" },
  md: { text: "min-h-12 rounded-xl px-4 text-base", icon: "h-12 w-12 rounded-xl text-base" },
  lg: { text: "min-h-14 rounded-2xl px-6 text-lg", icon: "h-14 w-14 rounded-2xl text-lg" },
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner in place of the icon and blocks clicks while work is in progress. */
  loading?: boolean;
  /** Leading icon. */
  icon?: ReactNode;
  /** Square icon-only button; callers must supply `aria-label`. */
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading = false, icon, iconOnly = false, className = "", children, disabled, type = "button", ...rest },
  ref
) {
  const leading = loading ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : icon;
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant]} ${iconOnly ? sizes[size].icon : sizes[size].text} ${className}`}
      {...rest}
    >
      {leading}
      {iconOnly ? null : children}
    </button>
  );
});
