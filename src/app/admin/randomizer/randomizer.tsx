"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Shuffle, Sparkles, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type S = { id: string; full_name: string; group_id: string | null };

function secureRandom(n: number) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}

export function Randomizer({ groups, students }: { groups: { id: string; name: string }[]; students: S[] }) {
  const [group, setGroup] = useState(groups[0]?.id ?? "all");
  const [extra, setExtra] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState<string | null>(null);
  const [mode, setMode] = useState<"pick" | "teams">("pick");
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState<string[][]>([]);
  const timer = useRef<number | null>(null);

  const pool = useMemo(() => {
    const names = (group === "all" ? students : students.filter((s) => s.group_id === group)).map((s) => s.full_name);
    extra.split("\n").map((x) => x.trim()).filter(Boolean).forEach((x) => names.push(x));
    return [...new Set(names)];
  }, [group, students, extra]);
  const remaining = pool.filter((n) => !picked.includes(n));

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const spin = () => {
    const list = remaining.length ? remaining : pool;
    if (!list.length) return;
    if (!remaining.length) setPicked([]);
    const winner = list[secureRandom(list.length)];
    setSpinning(true);
    let i = 0;
    const steps = 22;
    const step = () => {
      setDisplay(pool[secureRandom(pool.length)]);
      i++;
      if (i < steps) timer.current = window.setTimeout(step, 40 + i * i * 0.9);
      else {
        setDisplay(winner); setCurrent(winner); setSpinning(false);
        setPicked((p) => [...p.filter((x) => x !== winner), winner]);
      }
    };
    step();
  };

  const makeTeams = () => {
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) { const j = secureRandom(i + 1); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    const t: string[][] = Array.from({ length: teamCount }, () => []);
    shuffled.forEach((n, i) => t[i % teamCount].push(n));
    setTeams(t);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="inline-flex rounded-[10px] border border-line bg-surface-2 p-1">
          {[["pick", "Bitta talaba"], ["teams", "Jamoalar"]].map(([k, l]) => (
            <button key={k} onClick={() => setMode(k as "pick" | "teams")} className={cn("rounded-lg px-4 py-1.5 text-sm", mode === k ? "bg-surface font-medium shadow-[var(--shadow-sm)]" : "text-mute")}>{l}</button>
          ))}
        </div>

        {mode === "pick" ? (
          <div className="card flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
            <div className="text-[12px] uppercase tracking-[0.16em] text-mute">{spinning ? "Tanlanmoqda…" : current ? "Javob beradi" : "Tayyor"}</div>
            <div className={cn("mt-4 min-h-[5rem] font-display text-5xl leading-tight transition sm:text-7xl", spinning ? "text-mute blur-[1px]" : current ? "animate-pop text-ink" : "text-faint")}>
              {display ?? "?"}
            </div>
            {current && !spinning && <Sparkles className="mt-2 size-6 animate-pop text-saffron" />}
            <div className="mt-10 flex gap-2">
              <Button size="lg" className="h-14 px-8 text-lg" onClick={spin} disabled={spinning || pool.length === 0}><Shuffle className="size-5" /> Tanlash</Button>
              <Button size="lg" variant="secondary" className="h-14" onClick={() => { setPicked([]); setCurrent(null); setDisplay(null); }} aria-label="Qayta boshlash"><RotateCcw className="size-5" /></Button>
            </div>
            <p className="mt-4 text-sm text-mute">Navbatda: {remaining.length} / {pool.length}</p>
          </div>
        ) : (
          <div className="card p-6">
            <div className="flex items-end gap-3">
              <div><label className="mb-1.5 block text-[13px] font-medium text-ink-2">Jamoalar soni</label><Input type="number" min={2} max={10} value={teamCount} onChange={(e) => setTeamCount(Math.max(2, Math.min(10, Number(e.target.value))))} className="w-24" /></div>
              <Button onClick={makeTeams} disabled={pool.length < 2}><UsersRound className="size-4" /> Bo&apos;lish</Button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {teams.map((t, i) => (
                <div key={i} className="animate-fade-up rounded-xl border border-line p-4" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="font-medium">{i + 1}-jamoa <span className="text-sm text-mute">· {t.length}</span></div>
                  <ul className="mt-2 space-y-1 text-sm text-ink-2">{t.map((n) => <li key={n}>{n}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="card space-y-3 p-5">
          <label className="block text-[13px] font-medium text-ink-2">Guruh</label>
          <Select value={group} onChange={(e) => { setGroup(e.target.value); setPicked([]); setCurrent(null); setDisplay(null); setTeams([]); }}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            <option value="all">Barcha talabalar</option>
          </Select>
          <label className="block pt-2 text-[13px] font-medium text-ink-2">Qo&apos;shimcha ismlar</label>
          <textarea value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Har qatorda bitta ism" className="min-h-24 w-full rounded-[10px] border border-line-strong bg-surface p-3 text-sm focus:border-brand focus:outline-none" />
        </div>
        {picked.length > 0 && (
          <div className="card p-5">
            <div className="text-[13px] font-medium text-mute">Tanlanganlar</div>
            <ol className="mt-2 space-y-1 text-sm">{[...picked].reverse().map((n, i) => <li key={n} className={i === 0 ? "font-medium" : "text-mute"}>{picked.length - i}. {n}</li>)}</ol>
          </div>
        )}
      </aside>
    </div>
  );
}
