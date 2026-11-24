import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { SKILL_ICONS } from "@/components/skill-icons";
import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, EmptyState, LevelTag, PageHeader } from "@/components/ui/misc";
import { SKILL_META, cn, dueLabel, formatDate } from "@/lib/utils";
import type { Homework, Skill, Submission } from "@/lib/types";

export const metadata: Metadata = { title: "Uy vazifalari" };


export default async function HomeworkPage({ searchParams }: PageProps<"/homework">) {
  const sp = await searchParams;
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const [{ data: hw }, { data: subs }] = await Promise.all([
    supabase.from("homework").select("*").eq("is_published", true).order("created_at", { ascending: false }),
    supabase.from("homework_submissions").select("*").eq("user_id", profile.id),
  ]);
  const subMap = new Map(((subs ?? []) as Submission[]).map((s) => [s.homework_id, s]));
  const filter = typeof sp.skill === "string" ? (sp.skill as Skill) : null;
  const tab = sp.tab === "done" ? "done" : "todo";
  const all = (hw ?? []) as Homework[];
  const items = all
    .filter((h) => !filter || h.skill === filter)
    .filter((h) => (tab === "done" ? subMap.has(h.id) : !subMap.has(h.id) || subMap.get(h.id)?.status === "returned"));

  const qs = (o: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { tab, skill: filter, ...o };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    return `/homework?${p}`;
  };

  return (
    <div>
      <PageHeader eyebrow="Lesen · Hören · Sprechen · Schreiben" title="Uy vazifalari" description="To'rt ko'nikma bo'yicha topshiriqlar. O'qituvchi baholagach, bildirishnoma keladi." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-[10px] border border-line bg-surface-2 p-1">
          {[["todo", "Bajarilishi kerak"], ["done", "Topshirilgan"]].map(([k, l]) => (
            <Link key={k} href={qs({ tab: k })} className={cn("rounded-lg px-3.5 py-1.5 text-sm transition", tab === k ? "bg-surface font-medium shadow-[var(--shadow-sm)]" : "text-mute hover:text-ink")}>{l}</Link>
          ))}
        </div>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
          <Link href={qs({ skill: null })} className={cn("h-8 shrink-0 rounded-full border px-3 text-[13px] leading-[30px]", !filter ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2")}>Hammasi</Link>
          {(Object.keys(SKILL_META) as Skill[]).map((s) => {
            const Icon = SKILL_ICONS[s];
            return (
              <Link key={s} href={qs({ skill: s })} className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px]", filter === s ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2")}>
                <Icon className="size-3.5" /> {SKILL_META[s].de}
              </Link>
            );
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={ClipboardList} title={tab === "todo" ? "Hammasi bajarilgan" : "Hali topshirilgan vazifa yo'q"} text={tab === "todo" ? "Yangi vazifa qo'shilganda bildirishnoma olasiz." : undefined} />
      ) : (
        <ul className="grid gap-3">
          {items.map((h) => {
            const sub = subMap.get(h.id);
            const due = dueLabel(h.due_at);
            const Icon = SKILL_ICONS[h.skill];
            return (
              <li key={h.id}>
                <Link href={`/homework/${h.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-[var(--shadow-md)] sm:p-5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-sunken text-ink-2"><Icon className="size-5" strokeWidth={1.8} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-mute">
                      <span className="font-medium text-ink-2">{SKILL_META[h.skill].de}</span>· <LevelTag level={h.level} className="h-5 text-[11px]" />
                      {h.due_at && <span>· {formatDate(h.due_at, true)}</span>}
                    </div>
                    <div className="mt-1 truncate font-medium">{h.title}</div>
                  </div>
                  <div className="shrink-0">
                    {sub?.status === "graded" ? (
                      <Badge tone="brand">{sub.score}/{h.max_points}</Badge>
                    ) : sub?.status === "returned" ? (
                      <Badge tone="warn">Qayta ishlash</Badge>
                    ) : sub ? (
                      <Badge tone="info">Tekshirilmoqda</Badge>
                    ) : (
                      <Badge tone={due.tone === "danger" ? "danger" : due.tone === "warn" ? "warn" : "neutral"}>{due.text}</Badge>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
