import Link from "next/link";
import type { Metadata } from "next";
import { CalendarCheck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Avatar, LevelTag, PageHeader, Progress, SectionTitle, Stat } from "@/components/ui/misc";
import { ActivityBars } from "@/components/charts/activity-bars";
import { CompareBar } from "@/components/compare-bar";
import { cn, formatDate } from "@/lib/utils";
import type { StudentStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Natijalarim" };

const ATT = {
  present: { label: "Keldi", icon: CheckCircle2, cls: "text-brand" },
  late: { label: "Kechikdi", icon: Clock, cls: "text-saffron" },
  absent: { label: "Kelmadi", icon: XCircle, cls: "text-danger" },
  excused: { label: "Sababli", icon: CalendarCheck, cls: "text-info" },
} as const;

export default async function ProgressPage({ searchParams }: PageProps<"/progress">) {
  const sp = await searchParams;
  const scope = sp.scope === "all" ? "all" : "group";
  const period = sp.period === "all" ? "all" : sp.period === "month" ? "month" : "week";
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const [{ data: stats }, { data: board }, { data: attendance }] = await Promise.all([
    supabase.rpc("student_stats"),
    supabase.rpc("leaderboard", { p_scope: scope, p_period: period }),
    supabase.from("attendance_records").select("status, attendance_sessions(held_on, topic)").eq("user_id", profile.id).limit(30),
  ]);
  const s = stats as StudentStats | null;
  const rows = (board ?? []) as { user_id: string; full_name: string; avatar_url: string | null; group_name: string | null; xp: number; is_me: boolean }[];
  const att = (attendance ?? [])
    .map((a) => ({ status: a.status as keyof typeof ATT, ...(a.attendance_sessions as unknown as { held_on: string; topic: string | null }) }))
    .sort((a, b) => b.held_on.localeCompare(a.held_on));
  const link = (o: Record<string, string>) => `/progress?${new URLSearchParams({ scope, period, ...o })}`;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Tahlil" title="Natijalarim" description="Kunlik faollik, darajalar bo'yicha yo'l, guruh bilan solishtirish va davomat." />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Jami XP" value={s?.xp ?? 0} sub={`Bugun: ${s?.today_xp ?? 0}`} />
        <Stat label="O'rtacha test bali" value={`${s?.avg_score ?? 0}%`} sub={`${s?.tests_taken ?? 0} urinish`} accent="info" />
        <Stat label="Uy vazifasi o'rtachasi" value={`${s?.homework_avg ?? 0}%`} sub={`${s?.homework_pending ?? 0} ta kutilmoqda`} accent="saffron" />
        <Stat label="Davomat" value={`${s?.attendance_rate ?? 0}%`} sub={`${att.length} ta dars`} accent="brand" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-5">
          <SectionTitle>So&apos;nggi 28 kun · XP</SectionTitle>
          {s && <ActivityBars days={s.days} height={180} />}
        </section>
        <section className="card p-5">
          <SectionTitle>Darajalar bo&apos;yicha</SectionTitle>
          <ul className="space-y-4">
            {(s?.levels ?? []).map((l) => (
              <li key={l.level}>
                <div className="flex items-center justify-between text-sm">
                  <LevelTag level={l.level} />
                  <span className="tabular text-mute">{l.passed}/{l.total}</span>
                </div>
                <Progress className="mt-2" value={l.total ? (l.passed / l.total) * 100 : 0} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <SectionTitle>Guruh bilan solishtirish</SectionTitle>
          {s?.group_size ? (
            <div className="space-y-5">
              <CompareBar label="Tajriba bali (XP)" me={s.xp} group={s.group_avg_xp} />
              <CompareBar label="O'rtacha test bali" me={s.avg_score} group={s.group_avg_score} unit="%" max={100} />
              <CompareBar label="Tugatilgan darslar" me={s.lessons_passed} group={Number(s.group_avg_lessons)} />
            </div>
          ) : (
            <p className="py-4 text-sm text-mute">Siz hali guruhga biriktirilmagansiz. O&apos;qituvchi guruhga qo&apos;shgach, solishtirish ko&apos;rinadi.</p>
          )}
        </section>

        <section className="card p-5">
          <SectionTitle>So&apos;nggi testlar</SectionTitle>
          {(s?.recent_tests ?? []).length === 0 ? (
            <p className="py-4 text-sm text-mute">Hali test topshirilmagan.</p>
          ) : (
            <ul className="divide-y divide-line">
              {s!.recent_tests.map((t, i) => (
                <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-10 font-mono text-xs text-mute">#{t.position}</span>
                  <span className="min-w-0 flex-1 truncate">{t.lesson}</span>
                  <span className="text-xs text-faint">{formatDate(t.created_at)}</span>
                  <span className={cn("w-12 text-right font-mono font-semibold", t.passed ? "text-brand" : "text-danger")}>{t.score}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold">Reyting</h2>
            <div className="flex gap-2 text-[13px]">
              <div className="inline-flex rounded-lg border border-line p-0.5">
                {[["group", "Guruh"], ["all", "Hamma"]].map(([k, l]) => <Link key={k} href={link({ scope: k })} className={cn("rounded-md px-2.5 py-1", scope === k ? "bg-ink text-paper" : "text-mute")}>{l}</Link>)}
              </div>
              <div className="inline-flex rounded-lg border border-line p-0.5">
                {[["week", "Hafta"], ["month", "Oy"], ["all", "Umumiy"]].map(([k, l]) => <Link key={k} href={link({ period: k })} className={cn("rounded-md px-2.5 py-1", period === k ? "bg-ink text-paper" : "text-mute")}>{l}</Link>)}
              </div>
            </div>
          </div>
          {rows.length === 0 ? <p className="py-4 text-sm text-mute">Reyting bo&apos;sh.</p> : (
            <ol className="divide-y divide-line">
              {rows.map((r, i) => (
                <li key={r.user_id} className={cn("flex items-center gap-3 py-2.5", r.is_me && "-mx-2 rounded-lg bg-brand-softer px-2")}>
                  <span className={cn("w-6 text-center font-mono text-sm font-semibold", i < 3 ? "text-saffron" : "text-mute")}>{i + 1}</span>
                  <Avatar name={r.full_name} src={r.avatar_url} size={30} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.full_name}{r.is_me && <span className="ml-1.5 text-xs text-brand">(siz)</span>}</span>
                  {scope === "all" && r.group_name && <span className="hidden text-xs text-mute sm:block">{r.group_name}</span>}
                  <span className="font-mono text-sm font-semibold tabular">{r.xp}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card p-5">
          <SectionTitle>Davomat</SectionTitle>
          {att.length === 0 ? <p className="py-4 text-sm text-mute">Davomat hali belgilanmagan.</p> : (
            <ul className="divide-y divide-line">
              {att.map((a, i) => {
                const m = ATT[a.status];
                return (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                    <m.icon className={cn("size-4", m.cls)} />
                    <span className="flex-1 truncate">{a.topic || "Dars"}</span>
                    <span className="text-xs text-mute">{formatDate(a.held_on)}</span>
                    <span className={cn("w-16 text-right text-xs font-medium", m.cls)}>{m.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
