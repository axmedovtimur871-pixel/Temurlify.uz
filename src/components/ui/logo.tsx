import { cn } from "@/lib/utils";

/** Brand mark: a lowercase "t" wearing an umlaut — German, at a glance. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-brand" />
      <circle cx="11.5" cy="7.6" r="2.1" className="fill-saffron" />
      <circle cx="19.5" cy="7.6" r="2.1" className="fill-saffron" />
      <path
        d="M14 11.5h3.6v3.3h4.4v3.2h-4.4v5.1c0 1.2.6 1.7 1.7 1.7.9 0 1.7-.2 2.5-.5v3.1c-.9.4-2 .6-3.3.6-3 0-4.5-1.5-4.5-4.4V18h-2.6v-3.2H14v-3.3z"
        className="fill-brand-ink"
      />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-[1.45rem] leading-none tracking-tight text-ink">
          Temurlify
        </span>
      )}
    </span>
  );
}
