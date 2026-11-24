import { cn, initials } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Level } from "@/lib/types";

export function Badge({
  children, tone = "neutral", className,
}: { children: ReactNode; tone?: "neutral" | "brand" | "warn" | "danger" | "info" | "ink"; className?: string }) {
  const tones = {
    neutral: "bg-sunken text-ink-2",
    brand: "bg-brand-soft text-brand",
    warn: "bg-saffron-soft text-[color-mix(in_oklab,var(--saffron)_70%,var(--ink))]",
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
    ink: "bg-ink text-paper",
  };
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

const LEVEL_CLASSES: Record<Level, string> = {
  A1: "bg-lvl-a1/12 text-lvl-a1",
  A2: "bg-lvl-a2/12 text-lvl-a2",
  B1: "bg-lvl-b1/12 text-lvl-b1",
  B2: "bg-lvl-b2/12 text-lvl-b2",
  C1: "bg-lvl-c1/12 text-lvl-c1",
};

export function LevelTag({ level, className }: { level: Level; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-md px-2 font-mono text-[12px] font-semibold tracking-wide", LEVEL_CLASSES[level], className)}>
      {level}
    </span>
  );
}

export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "saffron" | "ink" }) {
  const v = Math.max(0, Math.min(100, value));
  const fill = { brand: "bg-brand", saffron: "bg-saffron", ink: "bg-ink" }[tone];
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-sunken", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", fill)} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Ring({ value, size = 56, stroke = 6, children, tone = "brand" }: { value: number; size?: number; stroke?: number; children?: ReactNode; tone?: "brand" | "saffron" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-sunken" />
        <circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeLinecap="round"
          className={cn("fill-none transition-[stroke-dashoffset] duration-700", tone === "brand" ? "stroke-brand" : "stroke-saffron")}
          strokeDasharray={c} strokeDashoffset={c - (c * v) / 100}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function Avatar({ name, src, size = 36, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />;
  }
  const hue = [...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 5;
  const palette = ["bg-lvl-a1/15 text-lvl-a1", "bg-lvl-a2/15 text-lvl-a2", "bg-lvl-b1/15 text-lvl-b1", "bg-lvl-b2/15 text-lvl-b2", "bg-lvl-c1/15 text-lvl-c1"][hue];
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold", palette, className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}

export function EmptyState({
  icon: Icon, title, text, action, className,
}: { icon: LucideIcon; title: string; text?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[14px] border border-dashed border-line-strong bg-surface-2 px-6 py-12 text-center", className)}>
      <div className="relative mb-4">
        <div className="absolute -inset-3 rounded-full bg-brand-softer" />
        <div className="relative grid size-12 place-items-center rounded-full border border-line bg-surface text-brand shadow-[var(--shadow-sm)]">
          <Icon className="size-5" strokeWidth={1.8} />
        </div>
      </div>
      <h3 className="font-medium text-ink">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-mute">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({
  eyebrow, title, description, actions, className,
}: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-[12px] font-medium uppercase tracking-[0.14em] text-mute">{eyebrow}</div>}
        <h1 className="font-display text-[2rem] leading-[1.1] tracking-tight text-ink sm:text-[2.35rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-mute">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Stat({
  label, value, sub, icon: Icon, accent = "brand",
}: { label: string; value: ReactNode; sub?: ReactNode; icon?: LucideIcon; accent?: "brand" | "saffron" | "info" | "danger" }) {
  const accents = {
    brand: "text-brand bg-brand-soft",
    saffron: "text-saffron bg-saffron-soft",
    info: "text-info bg-info-soft",
    danger: "text-danger bg-danger-soft",
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-mute">{label}</span>
        {Icon && (
          <span className={cn("grid size-8 place-items-center rounded-lg", accents[accent])}>
            <Icon className="size-4" strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-[2rem] leading-none tabular text-ink">{value}</div>
      {sub && <div className="mt-1.5 text-[12.5px] text-mute">{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-[15px] font-semibold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}
