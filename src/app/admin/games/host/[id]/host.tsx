"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Eye, Loader2, Maximize, Play, SkipForward, Trophy, Users, X } from "lucide-react";
import { useGameRealtime } from "@/app/(app)/games/play/[id]/player";
import { hostNext, hostReveal, hostStats, kickPlayer } from "../../actions";
import { Leaderboard, SLOTS, TimerBar, useCountdown } from "@/components/game/parts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GamePlayer, GameSession } from "@/lib/types";

export function HostView({ initialSession, initialPlayers, title, joinHost }: { initialSession: GameSession; initialPlayers: GamePlayer[]; title: string; joinHost: string }) {
  const { session, players } = useGameRealtime(initialSession, initialPlayers);
  const left = useCountdown(session.status === "live" ? session.question_started_at : null, session.seconds_per_question);
  const [stats, setStats] = useState<{ counts: Record<string, number>; answered: number } | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const act = (fn: () => Promise<{ error?: string }>) => start(async () => { const r = await fn(); setError(r.error ?? null); });

  // Poll answer count while a question is live; auto-reveal when time is up or everyone answered.
  useEffect(() => {
    if (session.status !== "live" && session.status !== "reveal") return;
    let stop = false;
    const tick = async () => { const s = await hostStats(session.id); if (!stop) setStats(s); };
    tick();
    const id = session.status === "live" ? window.setInterval(tick, 1200) : undefined;
    return () => { stop = true; if (id) clearInterval(id); };
  }, [session.status, session.current_index, session.id]);

  const everyone = players.length > 0 && (stats?.answered ?? 0) >= players.length;
  useEffect(() => {
    if (session.status === "live" && (left <= 0 || everyone) && !pending) act(() => hostReveal(session.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left <= 0, everyone, session.status]);

  const totalAnswers = Object.values(stats?.counts ?? {}).reduce((a, b) => a + b, 0);

  return (
    <div className="-mx-4 -mt-6 min-h-[calc(100vh-3.5rem)] bg-surface-2 px-4 py-6 sm:-mx-6 sm:-mt-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/admin/games" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"><ArrowLeft className="size-4" /> {title}</Link>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm text-mute"><Users className="size-4" /> {players.length}</span>
          <Button variant="ghost" size="sm" onClick={() => document.documentElement.requestFullscreen?.()}><Maximize className="size-4" /> To&apos;liq ekran</Button>
        </div>
      </div>

      {session.status === "lobby" && (
        <div className="mx-auto max-w-4xl text-center animate-fade-up">
          <p className="text-lg text-mute"><strong className="text-ink">{joinHost}/games</strong> sahifasiga kiring va kodni yozing</p>
          <div className="mt-4 font-mono text-[5.5rem] font-bold leading-none tracking-[0.18em] text-ink sm:text-[8rem]">{session.code.slice(0, 3)} {session.code.slice(3)}</div>
          <div className="mx-auto mt-10 flex min-h-24 max-w-3xl flex-wrap justify-center gap-2">
            {players.length === 0 && <p className="text-mute">O&apos;yinchilarni kutyapmiz…</p>}
            {players.map((p) => (
              <span key={p.id} className="group inline-flex animate-pop items-center gap-1 rounded-full border border-line bg-surface px-4 py-2 text-lg font-medium shadow-[var(--shadow-sm)]">
                {p.nickname}
                <button onClick={() => kickPlayer(p.id)} className="hidden text-faint hover:text-danger group-hover:inline" aria-label="Chiqarish"><X className="size-4" /></button>
              </span>
            ))}
          </div>
          <Button size="lg" className="mt-10 h-14 px-8 text-lg" disabled={pending || players.length === 0} onClick={() => act(() => hostNext(session.id))}>
            {pending ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5 fill-current" />} Boshlash
          </Button>
        </div>
      )}

      {(session.status === "live" || session.status === "reveal") && (
        <div key={session.current_index} className="mx-auto max-w-5xl animate-fade-up">
          <div className="mb-3 flex items-center justify-between text-mute">
            <span>Savol {session.current_index + 1} / {session.question_count}</span>
            <span>{stats?.answered ?? 0} / {players.length} javob berdi</span>
          </div>
          {session.status === "live" && <TimerBar left={left} total={session.seconds_per_question} />}
          <h1 className="mt-8 text-center font-display text-4xl leading-tight sm:text-6xl">{session.current_prompt}</h1>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {(session.current_options ?? []).map((o, i) => {
              const S = SLOTS[i % 4];
              const correct = session.status === "reveal" && session.last_correct_index === i;
              const n = stats?.counts?.[String(i)] ?? 0;
              return (
                <div key={i} className={cn("relative flex items-center gap-4 overflow-hidden rounded-2xl p-5 text-xl font-medium sm:text-2xl", S.cls, session.status === "reveal" && !correct && "opacity-35")}>
                  <S.icon className="size-7 shrink-0 fill-current" />
                  <span className="flex-1">{o}</span>
                  {session.status === "reveal" && <span className="font-mono text-2xl">{n}</span>}
                  {session.status === "reveal" && <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/40" style={{ width: `${totalAnswers ? (n / totalAnswers) * 100 : 0}%` }} />}
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex justify-center gap-3">
            {session.status === "live" ? (
              <Button size="lg" variant="secondary" disabled={pending} onClick={() => act(() => hostReveal(session.id))}><Eye className="size-5" /> Javobni ko&apos;rsatish</Button>
            ) : (
              <Button size="lg" disabled={pending} onClick={() => act(() => hostNext(session.id))}>
                {pending ? <Loader2 className="size-5 animate-spin" /> : <SkipForward className="size-5" />} {session.current_index + 1 >= session.question_count ? "Natijalar" : "Keyingi savol"}
              </Button>
            )}
          </div>
          {session.status === "reveal" && <div className="mx-auto mt-10 max-w-2xl"><h2 className="mb-3 font-medium">Reyting</h2><Leaderboard players={players} limit={5} big /></div>}
        </div>
      )}

      {session.status === "finished" && (
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <Trophy className="mx-auto size-14 text-saffron" strokeWidth={1.5} />
          <h1 className="mt-3 font-display text-5xl">G&apos;oliblar</h1>
          <Podium players={players} />
          <div className="mt-10 text-left"><Leaderboard players={players} limit={50} /></div>
        </div>
      )}
      {error && <p className="mt-6 text-center text-sm text-danger">{error}</p>}
    </div>
  );
}

function Podium({ players }: { players: GamePlayer[] }) {
  const top = [...players].sort((a, b) => b.score - a.score).slice(0, 3);
  const order = [top[1], top[0], top[2]];
  const heights = ["h-28", "h-40", "h-20"];
  return (
    <div className="mt-10 flex items-end justify-center gap-3">
      {order.map((p, i) => p ? (
        <div key={p.id} className="w-32 animate-fade-up sm:w-40" style={{ animationDelay: `${[200, 500, 0][i]}ms` }}>
          <div className="truncate text-lg font-medium">{p.nickname}</div>
          <div className="font-mono text-mute">{p.score}</div>
          <div className={cn("mt-2 grid place-items-center rounded-t-xl font-display text-4xl text-white", heights[i], i === 1 ? "bg-saffron" : "bg-ink-2")}>{[2, 1, 3][i]}</div>
        </div>
      ) : <div key={i} className="w-32 sm:w-40" />)}
    </div>
  );
}
