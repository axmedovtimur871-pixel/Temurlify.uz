import Link from "next/link";
import { AlertTriangle, BookText, ClipboardCheck, Megaphone, Gamepad2, Users, Activity, Target } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { Avatar, PageHeader, SectionTitle, Stat } from "@/components/ui/misc";
import { ActivityBars } from "@/components/charts/activity-bars";
import { LinkButton } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

type Overview = {
  students: number; active_today: number; active_week: number; groups: number; lessons: number; lessons_with_video: number;
  questions: number; vocabulary: number; to_grade: number; tests_week: number; avg_score_week: number;
  days: { day: string; active: number; xp: number }[];
  top: { id: string; full_name: string; xp: number; streak: number }[];
  struggling: { id: string; full_name: string; avg_score: number; attempts: number }[];
};

export default async function AdminHome() {
  const profile = await requireStaff();
  const supabase = await supabaseServer();
  const [{ data }, { data: recent }] = await Promise.all([
    supabase.rpc("admin_overview"),
    supabase.from("homework_submissions").select("id, submitted_at, homework_id, homework(title, skill), profiles!homework_submissions_user_id_fkey(full_name)").eq("status", "submitted").order("submitted_at", { ascending: false }).limit(6),
  ]);
  const o = data as Overview | null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Boshqaruv paneli"
        title={`Salom, ${profile.full_name.split(" ")[0]}`}
        description="Platformadagi bugungi holat."
        actions={<>
          <LinkButton href="/admin/announcements" variant="secondary" size="sm"><Megaphone className="size-4" /> E&apos;lon</LinkButton>
          <LinkButton href="/admin/homework/new" variant="secondary" size="sm"><ClipboardCheck className="size-4" /> Vazifa</LinkButton>
          <LinkButton href="/admin/games" size="sm"><Gamepad2 className="size-4" /> O&apos;yin boshlash</LinkButton>
        </>}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Talabalar" value={o?.students ?? 0} sub={`${o?.groups ?? 0} ta guruh`} icon={Users} />
        <Stat label="Bugun faol" value={o?.active_today ?? 0} sub={`Hafta davomida: ${o?.active_week ?? 0}`} icon={Activity} accent="info" />
        <Stat label="Tekshirilishi kerak" value={o?.to_grade ?? 0} sub="uy vazifalari" icon={ClipboardCheck} accent="saffron" />
        <Stat label="Haftalik o'rtacha ball" value={`${o?.avg_score_week ?? 0}%`} sub={`${o?.tests_week ?? 0} ta test`} icon={Target} accent="brand" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-5">
          <SectionTitle>Faol talabalar · 14 kun</SectionTitle>
          {o && <ActivityBars days={o.days.map((d) => ({ day: d.day, xp: d.xp, active: d.active }))} valueKey="active" label="talaba" height={170} />}
        </section>
        <section className="card p-5">
          <SectionTitle action={<Link href="/admin/homework" className="text-[13px] text-brand hover:underline">Hammasi</Link>}>Yangi topshiriqlar</SectionTitle>
          {(recent ?? []).length === 0 ? <p className="py-4 text-sm text-mute">Tekshiriladigan vazifa yo&apos;q.</p> : (
            <ul className="divide-y divide-line">
              {(recent ?? []).map((r) => {
                const hw = r.homework as unknown as { title: string } | null;
                const st = r.profiles as unknown as { full_name: string } | null;
                return (
                  <li key={r.id}>
                    <Link href={`/admin/homework/${r.homework_id}?s=${r.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                      <Avatar name={st?.full_name ?? "?"} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{st?.full_name}</div>
                        <div className="truncate text-xs text-mute">{hw?.title}</div>
                      </div>
                      <span className="text-xs text-faint">{timeAgo(r.submitted_at)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5">
          <SectionTitle>Eng faol talabalar</SectionTitle>
          {(o?.top ?? []).length === 0 ? <p className="text-sm text-mute">Hali ma&apos;lumot yo&apos;q.</p> : (
            <ol className="space-y-2.5">
              {o!.top.map((t, i) => (
                <li key={t.id} className="flex items-center gap-3">
                  <span className="w-4 font-mono text-xs text-mute">{i + 1}</span>
                  <Avatar name={t.full_name} size={28} />
                  <Link href={`/admin/students/${t.id}`} className="min-w-0 flex-1 truncate text-sm hover:underline">{t.full_name}</Link>
                  <span className="font-mono text-sm tabular">{t.xp}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="card p-5">
          <SectionTitle><span className="inline-flex items-center gap-2"><AlertTriangle className="size-4 text-saffron" /> Yordam kerak</span></SectionTitle>
          {(o?.struggling ?? []).length === 0 ? <p className="text-sm text-mute">So&apos;nggi 30 kunda o&apos;rtacha bali 60% dan past talaba yo&apos;q.</p> : (
            <ul className="space-y-2.5">
              {o!.struggling.map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <Avatar name={t.full_name} size={28} />
                  <Link href={`/admin/students/${t.id}`} className="min-w-0 flex-1 truncate text-sm hover:underline">{t.full_name}</Link>
                  <span className="font-mono text-sm text-danger">{t.avg_score}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5">
          <SectionTitle>Kontent</SectionTitle>
          <dl className="space-y-3 text-sm">
            {[
              ["Darslar", o?.lessons], ["Videoli darslar", o?.lessons_with_video], ["Test savollari", o?.questions], ["Lug'at so'zlari", o?.vocabulary],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between"><dt className="text-mute">{k}</dt><dd className="font-mono tabular">{v ?? 0}</dd></div>
            ))}
          </dl>
          <LinkButton href="/admin/lessons" variant="secondary" size="sm" className="mt-5 w-full"><BookText className="size-4" /> Darslarni boshqarish</LinkButton>
        </section>
      </div>
    </div>
  );
}
