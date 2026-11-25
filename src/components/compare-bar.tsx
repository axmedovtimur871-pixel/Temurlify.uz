/** "You vs group" comparison: two thin bars on a shared scale with direct labels. */
export function CompareBar({ label, me, group, unit = "", max }: { label: string; me: number; group: number; unit?: string; max?: number }) {
  const m = Math.max(1, max ?? Math.max(me, group));
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink-2">{label}</span>
        <span className={me >= group ? "text-[13px] font-medium text-brand" : "text-[13px] font-medium text-mute"}>
          {me >= group ? "Guruhdan yuqori" : "Guruhdan past"}
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center gap-3">
          <span className="w-12 text-xs text-mute">Siz</span>
          <div className="h-2.5 flex-1 rounded-full bg-sunken"><div className="h-full rounded-full bg-chart transition-[width] duration-700" style={{ width: `${(me / m) * 100}%` }} /></div>
          <span className="w-14 text-right text-sm font-medium tabular">{me}{unit}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-12 text-xs text-mute">Guruh</span>
          <div className="h-2.5 flex-1 rounded-full bg-sunken"><div className="h-full rounded-full bg-ink-2/40 transition-[width] duration-700" style={{ width: `${(group / m) * 100}%` }} /></div>
          <span className="w-14 text-right text-sm tabular text-mute">{group}{unit}</span>
        </div>
      </div>
    </div>
  );
}
