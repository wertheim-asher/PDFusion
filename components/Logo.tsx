interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function Logo({ className = "", iconClassName = "h-7 w-7", textClassName = "text-xl" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 28 28" className={`shrink-0 ${iconClassName}`} aria-hidden="true">
        <rect x="3" y="7" width="15" height="19" rx="3" fill="#FCA5A5" />
        <rect x="10" y="2" width="15" height="19" rx="3" fill="#DC2626" />
      </svg>
      <span className={`font-bold tracking-tight ${textClassName}`}>
        <span className="text-gray-900">PDF</span>
        <span className="text-red-600">usion</span>
      </span>
    </span>
  );
}
