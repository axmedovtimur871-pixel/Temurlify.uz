import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Avatar, Badge, LevelTag, PageHeader } from "@/components/ui/misc";
import { SKILL_META, cn, formatDate, timeAgo } from "@/lib/utils";
import { HomeworkForm } from "../form";
import { GradePanel, DeleteHomework } from "./client";
import type { Homework, Submission } from "@/lib/types";

export default async function AdminHomeworkDetail({ params, searchParams }: PageProps<"/admin/homework/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab === "edit" ? "edit" : "answers";
  await requireStaff();
  const supabase = await supabaseServer();
  const { data: hw } = await supabase.from("homework").select("*").eq("id", id).maybeSingle<Homework>();
  if (!hw) notFound();

  const [{ data: subs }, { data: groups }, { data: lessons }, { data: audience }] = await Promise.all([
    supabase.from("homework_submissions").select("*, profiles!homework_submissions_user_id_fkey(full_name, avatar_url)").eq("homework_id", id).order("submitted_at", { ascending: false }),
    supabase.from("groups").select("id,name").order("name"),
    supabase.from("lessons").select("id,position,title").order("position"),
    (() => { let q = supabase.from("profiles").select("id, full_name").eq("role", "student").eq("is_active", true); if (hw.group_id) q = q.eq("group_id", hw.group_id); return q; })(),
  ]);
  type Row = Submission & { profiles: { full_name: string; avatar_url: string | null } | null };
  const rows = (subs ?? []) as Row[];
  const submitted = new Set(rows.map((r) => r.user_id));
  const missing = (audience ?? []).filter((a) => !submitted.has(a.id));
  const selected = rows.find((r) => r.id === sp.s) ?? rows.find((r) => r.status === "submitted") ?? rows[0];

  let fileUrl: string | null = null;
  if (selected?.file_path) fileUrl = (await supabase.storage.from("homework").createSignedUrl(selected.file_path, 3600)).data?.signedUrl ?? null;

  return (
    <div>
      <Link href="/admin/homework" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"><ArrowLeft className="size-4" /> Uy vazifalari</Link>
      <PageHeader
        className="mt-4"
        eyebrow={<span className="flex items-center gap-2">{SKILL_META[hw.skill].de} · <LevelTag level={hw.level} className="h-5" /></span>}
        title={hw.title}
        description={`${hw.due_at ? `Muddat: ${formatDate(hw.due_at, true)} · ` : ""}${rows.length} ta javob · ${missing.length} ta topshirmagan`}
        actions={<DeleteHomework id={hw.id} />}
      />
      <div className="mb-6 flex gap-1 border-b border-line">
        {[["answers", "Javoblar"], ["edit", "Tahrirlash"]].map(([k, l]) => (
          <Link key={k} href={`/admin/homework/${id}?tab=${k}`} className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm", tab === k ? "border-brand font-medium" : "border-transparent text-mute")}>{l}</Link>
        ))}
      </div>

      {tab === "edit" ? <HomeworkForm homework={hw} groups={groups ?? []} lessons={lessons ?? []} /> : (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-4">
            <div className="card divide-y divide-line overflow-hidden">
              {rows.length === 0 && <p className="p-4 text-sm text-mute">Hali javoblar yo&apos;q.</p>}
              {rows.map((r) => (
                <Link key={r.id} href={`/admin/homework/${id}?s=${r.id}`} className={cn("flex items-center gap-3 px-4 py-3", selected?.id === r.id ? "bg-brand-softer" : "hover:bg-surface-2")}>
                  <Avatar name={r.profiles?.full_name ?? "?"} src={r.profiles?.avatar_url} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.profiles?.full_name}</div>
                    <div className="text-xs text-mute">{timeAgo(r.submitted_at)}</div>
                  </div>
                  {r.status === "graded" ? <Badge tone="brand">{r.score}</Badge> : r.status === "returned" ? <Badge tone="warn">Qaytarildi</Badge> : <Badge tone="info">Yangi</Badge>}
                </Link>
              ))}
            </div>
            {missing.length > 0 && (
              <div className="card p-4">
                <div className="text-[13px] font-medium text-mute">Topshirmaganlar · {missing.length}</div>
                <ul className="mt-2 space-y-1 text-sm">{missing.slice(0, 30).map((m) => <li key={m.id} className="truncate">{m.full_name}</li>)}</ul>
              </div>
            )}
          </div>
          {selected ? (
            <GradePanel
              key={selected.id}
              submission={{ id: selected.id, text: selected.text_answer, fileUrl, filePath: selected.file_path, score: selected.score, feedback: selected.feedback, status: selected.status, name: selected.profiles?.full_name ?? "", submittedAt: selected.submitted_at }}
              homeworkId={hw.id}
              maxPoints={hw.max_points}
              minWords={hw.min_words}
            />
          ) : <div className="card grid place-items-center p-10 text-sm text-mute">Javobni tanlang</div>}
        </div>
      )}
    </div>
  );
}
