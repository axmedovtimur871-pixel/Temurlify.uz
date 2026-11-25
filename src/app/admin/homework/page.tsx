import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList, Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, EmptyState, LevelTag, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { SKILL_ICONS } from "@/components/skill-icons";
import { SKILL_META, formatDate } from "@/lib/utils";
import type { Homework } from "@/lib/types";

export const metadata: Metadata = { title: "Uy vazifalari" };

export default async function AdminHomework() {
  await requireStaff();
  const supabase = await supabaseServer();
  const [{ data: hw }, { data: subs }, { data: groups }] = await Promise.all([
    supabase.from("homework").select("*").order("created_at", { ascending: false }),
    supabase.from("homework_submissions").select("homework_id, status"),
    supabase.from("groups").select("id, name"),
  ]);
  const stat = new Map<string, { total: number; pending: number }>();
  (subs ?? []).forEach((s) => {
    const c = stat.get(s.homework_id) ?? { total: 0, pending: 0 };
    c.total++; if (s.status === "submitted") c.pending++;
    stat.set(s.homework_id, c);
  });
  const gname = new Map((groups ?? []).map((g) => [g.id, g.name]));
  const items = (hw ?? []) as Homework[];

  return (
    <div>
      <PageHeader title="Uy vazifalari" description="Lesen, Hören, Sprechen, Schreiben topshiriqlari va baholash." actions={<LinkButton href="/admin/homework/new"><Plus className="size-4" /> Yangi vazifa</LinkButton>} />
      {items.length === 0 ? <EmptyState icon={ClipboardList} title="Vazifalar yo'q" text="Birinchi uy vazifasini yarating — talabalarga bildirishnoma boradi." action={<LinkButton href="/admin/homework/new">Vazifa yaratish</LinkButton>} /> : (
        <div className="card divide-y divide-line overflow-hidden">
          {items.map((h) => {
            const s = stat.get(h.id);
            const Icon = SKILL_ICONS[h.skill];
            return (
              <Link key={h.id} href={`/admin/homework/${h.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-surface-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sunken text-ink-2"><Icon className="size-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{h.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-mute">
                    <span>{SKILL_META[h.skill].de}</span>·<LevelTag level={h.level} className="h-5 text-[10px]" />·<span>{h.group_id ? gname.get(h.group_id) : "Barcha talabalar"}</span>
                    {h.due_at && <>·<span>{formatDate(h.due_at, true)}</span></>}
                  </div>
                </div>
                {!h.is_published && <Badge>Qoralama</Badge>}
                {s?.pending ? <Badge tone="warn">{s.pending} ta tekshirish</Badge> : null}
                <span className="w-20 text-right text-sm text-mute tabular">{s?.total ?? 0} javob</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
