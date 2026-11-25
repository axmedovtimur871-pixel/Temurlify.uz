import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader, Progress } from "@/components/ui/misc";
import { AchievementIcon } from "@/components/achievement-icon";
import { cn, formatDate } from "@/lib/utils";
import type { StudentStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Yutuqlar" };

type Achievement = { code: string; title: string; description: string; icon: string; metric: string; threshold: number };

export default async function AchievementsPage() {
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const [{ data: all }, { data: mine }, { data: stats }, { count: homework }, { count: games }, { count: perfect }] = await Promise.all([
    supabase.from("achievements").select("*").order("position"),
    supabase.from("user_achievements").select("code, earned_at").eq("user_id", profile.id),
    supabase.rpc("student_stats"),
    supabase.from("homework_submissions").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("game_players").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("test_attempts").select("id", { count: "exact", head: true }).eq("user_id", profile.id).eq("score", 100),
  ]);
  const s = stats as StudentStats | null;
  const earned = new Map((mine ?? []).map((m) => [m.code, m.earned_at as string]));
  const cardsReviewed = (s?.days ?? []).reduce((a, d) => a + d.cards, 0);
  const metric = (m: string) => ({
    lessons_passed: s?.lessons_passed ?? 0, xp: s?.xp ?? 0, streak: s?.longest_streak ?? 0,
    cards_reviewed: cardsReviewed, homework: homework ?? 0, games: games ?? 0, perfect_tests: perfect ?? 0,
  } as Record<string, number>)[m] ?? 0;
  const list = (all ?? []) as Achievement[];

  return (
    <div>
      <PageHeader eyebrow={`${earned.size} / ${list.length} ochilgan`} title="Yutuqlar" description="Har bir qadam uchun nishon. Davom eting — keyingisi yaqin." />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => {
          const got = earned.get(a.code);
          const value = Math.min(metric(a.metric), a.threshold);
          return (
            <li key={a.code} className={cn("card flex gap-4 p-5", !got && "bg-surface-2/60")}>
              <div className={cn("relative grid size-14 shrink-0 place-items-center rounded-2xl", got ? "bg-saffron-soft text-saffron" : "bg-sunken text-faint")}>
                <AchievementIcon name={a.icon} className="size-7" />
                {!got && <Lock className="absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-surface bg-sunken p-0.5 text-mute" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn("font-medium", !got && "text-ink-2")}>{a.title}</div>
                <p className="mt-0.5 text-sm text-mute">{a.description}</p>
                {got ? (
                  <p className="mt-2 text-xs text-brand">{formatDate(got)} da ochildi</p>
                ) : (
                  <div className="mt-2.5 flex items-center gap-2">
                    <Progress value={(value / a.threshold) * 100} tone="saffron" className="h-1.5 flex-1" />
                    <span className="text-xs text-mute tabular">{value}/{a.threshold}</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-faint">Kartochka statistikasi so&apos;nggi 28 kun bo&apos;yicha ko&apos;rsatiladi; nishon esa umumiy natija bo&apos;yicha beriladi.</p>
    </div>
  );
}
