"use client";

import { useEffect, useState } from "react";
import { Circle, Diamond, Square, Triangle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GamePlayer } from "@/lib/types";

/** Answer slots: colour + shape so they stay distinguishable without colour. */
export const SLOTS = [
  { icon: Triangle, cls: "bg-lvl-c1 text-white", ring: "ring-lvl-c1" },
  { icon: Diamond, cls: "bg-lvl-b1 text-white", ring: "ring-lvl-b1" },
  { icon: Circle, cls: "bg-lvl-a1 text-white", ring: "ring-lvl-a1" },
  { icon: Square, cls: "bg-lvl-b2 text-white", ring: "ring-lvl-b2" },
];

export function useCountdown(startedAt: string | null, seconds: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return seconds;
  return Math.max(0, Math.min(seconds, seconds - (now - new Date(startedAt).getTime()) / 1000));
}

export function TimerBar({ left, total }: { left: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
        <div className={cn("h-full rounded-full transition-[width] duration-200 ease-linear", left < 5 ? "bg-danger" : "bg-brand")} style={{ width: `${(left / total) * 100}%` }} />
      </div>
      <span className={cn("w-8 text-right font-mono text-lg font-semibold tabular", left < 5 && "text-danger")}>{Math.ceil(left)}</span>
    </div>
  );
}

export function Leaderboard({ players, me, limit = 10, big = false }: { players: GamePlayer[]; me?: string; limit?: number; big?: boolean }) {
  const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, limit);
  const max = Math.max(1, ...sorted.map((p) => p.score));
  if (sorted.length === 0) return <p className="text-sm text-mute">Hali o&apos;yinchilar yo&apos;q</p>;
  return (
    <ol className="space-y-2">
      {sorted.map((p, i) => (
        <li
          key={p.id}
          className={cn("relative flex items-center gap-3 overflow-hidden rounded-xl border px-4 transition-all duration-500", big ? "py-3.5" : "py-2.5", p.user_id === me ? "border-brand bg-brand-softer" : "border-line bg-surface")}
        >
          <div className="absolute inset-y-0 left-0 bg-sunken/70 transition-[width] duration-700" style={{ width: `${(p.score / max) * 100}%` }} />
          <span className={cn("relative w-6 font-mono font-semibold", i === 0 ? "text-saffron" : "text-mute")}>{i === 0 ? <Crown className="size-5" /> : i + 1}</span>
          <span className={cn("relative flex-1 truncate font-medium", big && "text-lg")}>{p.nickname}</span>
          <span className={cn("relative font-mono font-semibold tabular", big && "text-lg")}>{p.score}</span>
        </li>
      ))}
    </ol>
  );
}
