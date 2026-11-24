import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, ClipboardList, Flame, Layers, Megaphone, Pin, Target, Trophy, PartyPopper } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/button";
import { Badge, EmptyState, LevelTag, Progress, Ring, SectionTitle, Stat } from "@/components/ui/misc";
import { ActivityBars } from "@/components/charts/activity-bars";
import { SKILL_META, dueLabel, formatDate, timeAgo } from "@/lib/utils";
import type { CurriculumRow, Homework } from "@/lib/types";
import type { StudentStats } from "@/lib/stats";

export const metadata: Metadata = { title: "Bosh sahifa" };

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Tashkent" }).format(new Date()));
  if (h < 5) return "Xayrli tun";
  if (h < 12) return "Xayrli tong";
  if (h < 18) return "Xayrli kun";
  return "Xayrli kech";
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await supabaseServer();

  const [{ data: stats }, { data: curriculum }, { data: homework }, { data: subs }, { data: announcements }] = await Promise.all([
    supabase.rpc("student_stats"),
    supabase.rpc("my_curriculum"),
    supabase.from("homework").select("*").eq("is_published", true).order("due_at", { ascending: true, nullsFirst: false }).limit(20),
    supabase.from("homework_submissions").select("homework_id,status,score").eq("user_id", profile.id),
    supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(3),
  ]);

  const s = stats as StudentStats | null;
  const lessons = (curriculum ?? []) as CurriculumRow[];
  const next = lessons.find((l) => l.unlocked && !l.passed) ?? null;
  const submitted = new Set((subs ?? []).map((x) => x.homework_id));
  const pending = ((homework ?? []) as Homework[]).filter((h) => !submitted.has(h.id)).slice(0, 3);
  const goalPct = s ? Math.round((s.today_xp / Math.max(1, s.daily_goal)) * 100) : 0;
  const firstName = profile.full_name.split(" ")[0] || "do'st";

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end animate-fade-up">
        <div>
          <p className="text-sm text-mute">{formatDate(new Date())}</p>
          <h1 className="mt-1 font-display text-[2.4rem] leading-[1.05] tracking-tight sm:text-5xl">
            {greeting()}, {firstName}.
          </h1>
        </div>
        <div className="card flex items-center gap-4 px-4 py-3">
          <Ring value={goalPct} size={54} tone={goalPct >= 100 ? "saffron" : "brand"}>
            <Target className={goalPct >= 100 ? "size-5 text-saffron" : "size-5 text-brand"} />
          </Ring>
          <div>
            <div className="text-[13px] text-mute">Bugungi maqsad</div>
            <div className="font-medium tabular">{s?.today_xp ?? 0} / {s?.daily_goal ?? 50} XP</div>
          </div>
        </div>
      </section>

      {/* Continue */}
      {next ? (
        <section className="card relative overflow-hidden animate-fade-up [animation-delay:60ms]">
          <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">Davom eting</Badge>
                <LevelTag level={next.level} />
                <span className="font-mono text-xs text-mute">{next.position}-dars · {next.duration_min} daqiqa</span>
              </div>
              <h2 className="mt-4 font-display text-3xl leading-tight sm:text-[2.6rem]">{next.title}</h2>
              <p className="mt-1.5 text-ink-2">{next.title_uz} · <span className="text-mute">{next.grammar}</span></p>
              {next.attempts > 0 && (
                <p className="mt-3 text-sm text-mute">Eng yaxshi natija: <span className="font-medium text-ink">{next.best_score}%</span> · {next.attempts} urinish</p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <LinkButton href={`/learn/${next.id}`} size="lg">Darsni ochish <ArrowRight className="size-4" /></LinkButton>
              <LinkButton href="/learn" size="lg" variant="secondary">Barcha darslar</LinkButton>
            </div>
          </div>
          <div className="border-t border-line bg-surface-2 px-5 py-3 sm:px-7">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-mute">Umumiy yo&apos;l</span>
              <span className="font-medium tabular">{s?.lessons_passed ?? 0} / {s?.total_lessons ?? 120}</span>
            </div>
            <Progress className="mt-2" value={((s?.lessons_passed ?? 0) / Math.max(1, s?.total_lessons ?? 120)) * 100} />
          </div>
        </section>
      ) : lessons.length > 0 ? (
        <EmptyState icon={PartyPopper} title="Barcha darslar tugatildi!" text="Siz butun dasturni yakunladingiz. Kartochkalarni takrorlashda davom eting." />
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tugatilgan darslar" value={s?.lessons_passed ?? 0} sub={`${s?.total_lessons ?? 120} tadan`} icon={BookOpen} />
        <Stat label="O'rtacha ball" value={`${s?.avg_score ?? 0}%`} sub={`${s?.tests_taken ?? 0} ta test`} icon={Target} accent="info" />
        <Stat label="Takrorlash kerak" value={s?.cards_due ?? 0} sub={`${s?.cards_total ?? 0} ta kartochka`} icon={Layers} accent="saffron" />
        <Stat label="Ketma-ket kunlar" value={s?.streak ?? 0} sub={`Rekord: ${s?.longest_streak ?? 0} kun`} icon={Flame} accent="danger" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <SectionTitle action={<Link href="/progress" className="text-[13px] text-brand hover:underline">Batafsil</Link>}>Kunlik faollik · XP</SectionTitle>
          {s && <ActivityBars days={s.days} />}
          {s?.group_rank && (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3 text-sm">
              <Trophy className="size-4 text-saffron" />
              <span className="text-ink-2">Guruhda <strong className="text-ink">{s.group_rank}-o&apos;rin</strong> ({s.group_size} kishidan)</span>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="card p-5">
            <SectionTitle action={<Link href="/homework" className="text-[13px] text-brand hover:underline">Hammasi</Link>}>Uy vazifalari</SectionTitle>
            {pending.length === 0 ? (
              <p className="flex items-center gap-2 py-3 text-sm text-mute"><ClipboardList className="size-4" /> Hozircha topshirilmagan vazifa yo&apos;q.</p>
            ) : (
              <ul className="-mx-2 divide-y divide-line">
                {pending.map((h) => {
                  const due = dueLabel(h.due_at);
                  return (
                    <li key={h.id}>
                      <Link href={`/homework/${h.id}`} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-2">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken font-mono text-[11px] font-semibold text-ink-2">{SKILL_META[h.skill].de.slice(0, 2).toUpperCase()}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{h.title}</span>
                          <span className="text-xs text-mute">{SKILL_META[h.skill].de} · {SKILL_META[h.skill].uz}</span>
                        </span>
                        <Badge tone={due.tone === "danger" ? "danger" : due.tone === "warn" ? "warn" : "neutral"}>{due.text}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <SectionTitle action={<Link href="/notifications" className="text-[13px] text-brand hover:underline">Bildirishnomalar</Link>}>E&apos;lonlar</SectionTitle>
            {(announcements ?? []).length === 0 ? (
              <p className="flex items-center gap-2 py-3 text-sm text-mute"><Megaphone className="size-4" /> Yangi e&apos;lonlar yo&apos;q.</p>
            ) : (
              <ul className="space-y-4">
                {(announcements ?? []).map((a) => (
                  <li key={a.id}>
                    <div className="flex items-center gap-2">
                      {a.pinned && <Pin className="size-3.5 text-saffron" />}
                      <span className="text-sm font-medium">{a.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[13px] text-mute">{a.body}</p>
                    <p className="mt-1 text-[11.5px] text-faint">{timeAgo(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
