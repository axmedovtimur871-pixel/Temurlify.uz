"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

type Day = { day: string; xp: number; lessons?: number; cards?: number; active?: number };

/**
 * Single-series daily bar chart. No legend (the title names the series),
 * thin bars with 2px gaps and rounded data-ends, hover tooltip, recessive axis,
 * and an accessible table for screen readers.
 */
export function ActivityBars({ days, label = "XP", height = 140, valueKey = "xp" }: { days: Day[]; label?: string; height?: number; valueKey?: "xp" | "active" }) {
  const [hover, setHover] = useState<number | null>(null);
  const values = days.map((d) => Number(d[valueKey] ?? 0));
  const max = Math.max(10, ...values);
  const nice = Math.ceil(max / 10) * 10;
  const h = hover !== null ? days[hover] : null;

  return (
    <div className="relative">
      <div className="mb-2 flex h-5 items-baseline gap-2 text-[12.5px]">
        {h ? (
          <>
            <span className="font-medium text-ink tabular">{Number(h[valueKey] ?? 0)} {label}</span>
            <span className="text-mute">{formatDate(h.day)}</span>
            {valueKey === "xp" && (h.lessons ?? 0) > 0 && <span className="text-mute">· {h.lessons} dars</span>}
            {valueKey === "xp" && (h.cards ?? 0) > 0 && <span className="text-mute">· {h.cards} kartochka</span>}
          </>
        ) : (
          <span className="text-faint">Ustun ustiga olib boring</span>
        )}
      </div>
      <div className="relative" style={{ height }}>
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[nice, nice / 2, 0].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <span className="w-7 text-right text-[10.5px] text-faint tabular">{t}</span>
              <div className="h-px flex-1 bg-line/70" />
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 left-9 right-0 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
          {days.map((d, i) => {
            const v = values[i];
            const pct = (v / nice) * 100;
            return (
              <button
                key={d.day}
                type="button"
                aria-label={`${formatDate(d.day)}: ${v} ${label}`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onClick={() => setHover(i)}
                className="group relative flex h-full flex-1 items-end focus:outline-none"
              >
                <span
                  className={`block w-full rounded-t-[4px] transition-[height,opacity] duration-500 ${v === 0 ? "bg-line" : "bg-chart"} ${hover !== null && hover !== i ? "opacity-45" : ""}`}
                  style={{ height: v === 0 ? 2 : `${Math.max(pct, 3)}%` }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 ml-9 flex justify-between text-[10.5px] text-faint">
        <span>{formatDate(days[0]?.day)}</span>
        <span>Bugun</span>
      </div>
      <table className="sr-only">
        <caption>Kunlik {label}</caption>
        <tbody>{days.map((d, i) => <tr key={d.day}><td>{d.day}</td><td>{values[i]}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
