import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

const control =
  "w-full rounded-[10px] border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-faint shadow-[var(--shadow-sm)] transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12 disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-28 py-3 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(control, "h-11 appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236c7180' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...props}
    />
  );
}

export function Field({
  label, hint, error, children, className, htmlFor,
}: { label: ReactNode; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink-2">{label}</label>
      {children}
      {error ? <p className="text-[13px] text-danger">{error}</p> : hint ? <p className="text-[12.5px] text-mute">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-sm text-ink-2", className)}>
      <input type="checkbox" className="size-4 rounded border-line-strong accent-[var(--brand)]" {...props} />
      {label}
    </label>
  );
}

export function FormMessage({ state }: { state?: { error?: string | null; ok?: string | null } | null }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <p
      role="status"
      className={cn(
        "rounded-[10px] px-3.5 py-2.5 text-sm animate-fade-up",
        state.error ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand",
      )}
    >
      {state.error ?? state.ok}
    </p>
  );
}
