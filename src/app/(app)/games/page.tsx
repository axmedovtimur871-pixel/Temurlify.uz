import type { Metadata } from "next";
import { Gamepad2, History, Trophy } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader, SectionTitle } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";
import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: "O'yinlar" };

export default async function GamesPage() {
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const { data: history } = await supabase
    .from("game_players")
    .select("score, correct_count, joined_at, game_sessions(code, status, question_count, game_sets(title))")
    .eq("user_id", profile.id)
    .order("joined_at", { ascending: false })
    .limit(10);

  return (
    <div>
      <PageHeader eyebrow="Jonli o'yinlar" title="O'yinga qo'shiling" description="O'qituvchi ekranda ko'rsatgan 6 xonali Game ID ni kiriting. Tez va to'g'ri javob — ko'proq ball." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="card p-6 sm:p-8">
          <div className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand"><Gamepad2 className="size-6" /></div>
          <JoinForm defaultNick={profile.full_name.split(" ")[0]} />
        </div>
        <div className="card p-5">
          <SectionTitle><span className="inline-flex items-center gap-2"><History className="size-4 text-mute" /> O&apos;yinlar tarixi</span></SectionTitle>
          {(history ?? []).length === 0 ? (
            <p className="py-6 text-sm text-mute">Hali o&apos;yinlarda qatnashmagansiz.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(history ?? []).map((h, i) => {
                const s = h.game_sessions as unknown as { code: string; question_count: number; game_sets: { title: string } | null } | null;
                return (
                  <li key={i} className="flex items-center gap-3 py-3">
                    <Trophy className="size-4 text-saffron" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{s?.game_sets?.title ?? "O'yin"}</div>
                      <div className="text-xs text-mute">{formatDate(h.joined_at, true)} · {h.correct_count}/{s?.question_count ?? 0} to&apos;g&apos;ri</div>
                    </div>
                    <span className="font-mono text-sm font-semibold tabular">{h.score}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
