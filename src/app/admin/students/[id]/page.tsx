import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Avatar, Badge, LevelTag, PageHeader, SectionTitle, Stat } from "@/components/ui/misc";
import { ActivityBars } from "@/components/charts/activity-bars";
import { cn, formatDate, SKILL_META } from "@/lib/utils";
import { LessonUnlock, StudentDanger } from "./client";
import type { Profile, Skill } from "@/lib/types";
import type { StudentStats } from "@/lib/stats";

export default async function StudentDetail({ params }: PageProps<"/admin/students/[id]">) {
  const { id } = await params;
  const me = await requireStaff();
  const supabase = await supabaseServer();
  const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>();
  if (!p) notFound();
  const [{ data: stats }, { data: lessons }, { data: progress }, { data: subs }, { data: group }] = await Promise.all([
    supabase.rpc("student_stats", { p_user: id }),
    supabase.from("lessons").select("id, position, title, level").order("position"),
    supabase.from("lesson_progress").select("*").eq("user_id", id),
    supabase.from("homework_submissions").select("id, status, score, submitted_at, homework_id, homework(title, skill, max_points)").eq("user_id", id).order("submitted_at", { ascending: false }).limit(20),
    p.group_id ? supabase.from("groups").select("name").eq("id", p.group_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const s = stats as StudentStats | null;
  const prog = new Map((progress ?? []).map((x) => [x.lesson_id, x]));
  const lessonRows = (lessons ?? []).map((l, i, arr) => {
    const pr = prog.get(l.id);
    const prevPassed = i === 0 || Boolean(prog.get(arr[i - 1].id)?.passed);
    const unlocked = prevPassed || pr?.passed || pr?.manually_unlocked;
    return { ...l, passed: Boolean(pr?.passed), best: pr?.best_score ?? 0, attempts: pr?.attempts ?? 0, manual: Boolean(pr?.manually_unlocked), unlocked: Boolean(unlocked) };
  });

  return (
    <div className="space-y-8">
      <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"><ArrowLeft className="size-4" /> Talabalar</Link>
      <PageHeader
        title={<span className="flex items-center gap-4"><Avatar name={p.full_name} src={p.avatar_url} size={56} /> {p.full_name}</span>}
        description={`${p.email ?? ""}${p.phone ? ` · ${p.phone}` : ""} · ${group?.name ?? "Guruhsiz"} · ro'yxatdan o'tgan: ${formatDate(p.created_at)}`}
      />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="XP" value={s?.xp ?? 0} sub={`${s?.streak ?? 0} kun seriya`} />
        <Stat label="Darslar" value={`${s?.lessons_passed ?? 0}/${s?.total_lessons ?? 0}`} />
        <Stat label="O'rtacha test" value={`${s?.avg_score ?? 0}%`} accent="info" />
        <Stat label="Uy vazifasi" value={`${s?.homework_avg ?? 0}%`} sub={`${s?.homework_pending ?? 0} kutilmoqda`} accent="saffron" />
        <Stat label="Davomat" value={`${s?.attendance_rate ?? 0}%`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <SectionTitle>Faollik · 28 kun</SectionTitle>
          {s && <ActivityBars days={s.days} />}
        </section>
        <section className="card p-5">
          <SectionTitle>Uy vazifalari</SectionTitle>
          {(subs ?? []).length === 0 ? <p className="text-sm text-mute">Topshiriqlar yo&apos;q.</p> : (
            <ul className="divide-y divide-line">
              {(subs ?? []).map((x) => {
                const hw = x.homework as unknown as { title: string; skill: Skill; max_points: number } | null;
                return (
                  <li key={x.id}>
                    <Link href={`/admin/homework/${x.homework_id}?s=${x.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:opacity-80">
                      <span className="w-16 text-xs text-mute">{hw ? SKILL_META[hw.skill].de : ""}</span>
                      <span className="min-w-0 flex-1 truncate">{hw?.title}</span>
                      {x.status === "graded" ? <Badge tone="brand">{x.score}/{hw?.max_points}</Badge> : x.status === "returned" ? <Badge tone="warn">Qaytarilgan</Badge> : <Badge tone="info">Yangi</Badge>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5">
        <SectionTitle>Darslar holati · qo&apos;lda ochish</SectionTitle>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {lessonRows.map((l) => (
            <div key={l.id} className={cn("flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm", l.passed ? "border-brand/30 bg-brand-softer" : l.unlocked ? "border-line bg-surface" : "border-line bg-surface-2 text-mute")}>
              <span className="w-7 font-mono text-xs">{l.position}</span>
              <LevelTag level={l.level} className="h-5 text-[10px]" />
              <span className="min-w-0 flex-1 truncate">{l.title}</span>
              {l.attempts > 0 && <span className={cn("font-mono text-xs", l.passed ? "text-brand" : "text-danger")}>{l.best}%</span>}
              {!l.passed && <LessonUnlock userId={p.id} lessonId={l.id} manual={l.manual} unlocked={l.unlocked} />}
            </div>
          ))}
        </div>
      </section>

      <StudentDanger id={p.id} canDelete={me.role === "admin" && me.id !== p.id} />
    </div>
  );
}
