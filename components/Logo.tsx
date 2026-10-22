interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function Logo({ className = "", iconClassName = "h-9 w-9", textClassName = "text-2xl" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 28 28" className={`shrink-0 ${iconClassName}`} aria-hidden="true">
        <rect x="3" y="7" width="15" height="19" rx="3" fill="#FCA5A5" />
        <rect x="10" y="2" width="15" height="19" rx="3" fill="#DC2626" />
      </svg>
      <span className={`font-display font-extrabold tracking-tight ${textClassName}`}>
        <span className="text-ink">PDF</span>
        <span className="text-brand">usion</span>
      </span>
    </span>
  );
}
