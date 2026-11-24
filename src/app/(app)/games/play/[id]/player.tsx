"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Hourglass, Loader2, Trophy, XCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { answerGame, roundStats } from "../../actions";
import { Leaderboard, SLOTS, TimerBar, useCountdown } from "@/components/game/parts";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GamePlayer, GameSession } from "@/lib/types";

export function useGameRealtime(initialSession: GameSession, initialPlayers: GamePlayer[]) {
  const [session, setSession] = useState(initialSession);
  const [players, setPlayers] = useState(initialPlayers);
  useEffect(() => {
    const supabase = supabaseBrowser();
    const ch = supabase
      .channel(`game:${initialSession.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${initialSession.id}` },
        (p: { new: Record<string, unknown> }) => setSession(p.new as unknown as GameSession))
      .on("postgres_changes", { event: "*", schema: "public", table: "game_players", filter: `session_id=eq.${initialSession.id}` },
        (p: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          setPlayers((cur) => {
            if (p.eventType === "DELETE") return cur.filter((x) => x.id !== (p.old as { id: string }).id);
            const row = p.new as unknown as GamePlayer;
            const i = cur.findIndex((x) => x.id === row.id);
            if (i === -1) return [...cur, row];
            const copy = [...cur]; copy[i] = row; return copy;
          });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [initialSession.id]);
  return { session, players };
}

export function PlayerView({ initialSession, initialPlayers, userId }: { initialSession: GameSession; initialPlayers: GamePlayer[]; userId: string }) {
  const { session, players } = useGameRealtime(initialSession, initialPlayers);
  const left = useCountdown(session.status === "live" ? session.question_started_at : null, session.seconds_per_question);
  const [picked, setPicked] = useState<{ index: number; choice: number } | null>(null);
  const [mine, setMine] = useState<{ is_correct?: boolean; points?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const me = players.find((p) => p.user_id === userId);
  const rank = [...players].sort((a, b) => b.score - a.score).findIndex((p) => p.user_id === userId) + 1;

  useEffect(() => {
    if (session.status === "reveal") roundStats(session.id).then((s) => setMine(s?.mine ?? null));
    if (session.status === "live") { setMine(null); setError(null); }
  }, [session.status, session.current_index, session.id]);

  const choose = async (choice: number) => {
    if (picked?.index === session.current_index || left <= 0) return;
    setPicked({ index: session.current_index, choice });
    setSending(true);
    const res = await answerGame(session.id, choice);
    setSending(false);
    if (res.error) setError(res.error);
  };

  const answered = picked?.index === session.current_index;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
        <div>
          <div className="text-xs text-mute">Game ID</div>
          <div className="font-mono text-lg font-semibold tracking-widest">{session.code}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-mute">{me?.nickname}</div>
          <div className="font-mono text-lg font-semibold tabular">{me?.score ?? 0} <span className="text-sm font-normal text-mute">ball{rank > 0 && ` · ${rank}-o'rin`}</span></div>
        </div>
      </div>

      {session.status === "lobby" && (
        <div className="card p-8 text-center animate-fade-up">
          <Hourglass className="mx-auto size-10 animate-pulse text-brand" strokeWidth={1.5} />
          <h1 className="mt-4 font-display text-3xl">Siz o&apos;yindasiz!</h1>
          <p className="mt-1 text-mute">O&apos;qituvchi o&apos;yinni boshlashini kuting. Ekranda ismingizni ko&apos;ring.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {players.map((p) => <span key={p.id} className={cn("rounded-full border px-3 py-1 text-sm animate-pop", p.user_id === userId ? "border-brand bg-brand-soft text-brand" : "border-line")}>{p.nickname}</span>)}
          </div>
        </div>
      )}

      {(session.status === "live" || session.status === "reveal") && (
        <div key={session.current_index} className="animate-fade-up">
          <div className="mb-3 flex items-center justify-between text-sm text-mute">
            <span>Savol {session.current_index + 1}/{session.question_count}</span>
          </div>
          {session.status === "live" && <TimerBar left={left} total={session.seconds_per_question} />}
          <h1 className="mt-6 font-display text-3xl leading-snug sm:text-4xl">{session.current_prompt}</h1>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {(session.current_options ?? []).map((opt, i) => {
              const S = SLOTS[i % 4];
              const chosen = answered && picked?.choice === i;
              const isCorrect = session.status === "reveal" && session.last_correct_index === i;
              const dim = (answered && !chosen && session.status === "live") || (session.status === "reveal" && !isCorrect);
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={answered || session.status !== "live" || left <= 0}
                  className={cn(
                    "flex min-h-24 items-center gap-3 rounded-2xl p-4 text-left text-[17px] font-medium shadow-[var(--shadow-md)] transition active:scale-[0.98]",
                    S.cls, dim && "opacity-30", chosen && "ring-4 ring-offset-2 ring-offset-paper " + S.ring,
                  )}
                >
                  <S.icon className="size-6 shrink-0 fill-current" />
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 min-h-16 text-center">
            {session.status === "live" && answered && (
              <p className="inline-flex items-center gap-2 text-mute">{sending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4 text-brand" />} Javob qabul qilindi. Natijani kuting…</p>
            )}
            {session.status === "live" && !answered && left <= 0 && <p className="text-mute">Vaqt tugadi</p>}
            {error && <p className="text-sm text-danger">{error}</p>}
            {session.status === "reveal" && (
              mine?.is_correct ? (
                <p className="inline-flex animate-pop items-center gap-2 rounded-full bg-brand-soft px-4 py-2 font-medium text-brand"><CheckCircle2 className="size-5" /> To&apos;g&apos;ri! +{mine.points}</p>
              ) : (
                <p className="inline-flex animate-pop items-center gap-2 rounded-full bg-danger-soft px-4 py-2 font-medium text-danger"><XCircle className="size-5" /> {mine ? "Noto'g'ri" : "Javob berilmadi"}</p>
              )
            )}
          </div>
        </div>
      )}

      {session.status === "finished" && (
        <div className="animate-fade-up">
          <div className="card p-8 text-center">
            <Trophy className="mx-auto size-12 text-saffron" strokeWidth={1.5} />
            <h1 className="mt-3 font-display text-4xl">O&apos;yin tugadi</h1>
            <p className="mt-1 text-mute">Siz {rank}-o&apos;rinni egalladingiz · {me?.score ?? 0} ball · {me?.correct_count ?? 0} ta to&apos;g&apos;ri javob</p>
          </div>
          <div className="mt-6"><Leaderboard players={players} me={userId} /></div>
          <div className="mt-6 text-center"><LinkButton href="/games" variant="secondary">O&apos;yinlarga qaytish</LinkButton></div>
        </div>
      )}
    </div>
  );
}
