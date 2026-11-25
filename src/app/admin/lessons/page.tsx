import Link from "next/link";
import type { Metadata } from "next";
import { EyeOff, FileText, Video } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { LevelTag, PageHeader } from "@/components/ui/misc";
import { LEVELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NewLesson, MoveButtons } from "./client";

export const metadata: Metadata = { title: "Darslar" };

export default async function AdminLessons({ searchParams }: PageProps<"/admin/lessons">) {
  const sp = await searchParams;
  await requireStaff();
  const level = typeof sp.level === "string" && LEVELS.includes(sp.level as never) ? sp.level : "A1";
  const supabase = await supabaseServer();
  const [{ data: lessons }, { data: qs }, { data: vs }, { data: all }] = await Promise.all([
    supabase.from("lessons").select("id, position, title, title_uz, level, video_url, video_path, vocab_file_path, is_published").eq("level", level).order("position"),
    supabase.from("questions").select("lesson_id"),
    supabase.from("vocabulary").select("lesson_id").not("lesson_id", "is", null),
    supabase.from("lessons").select("level"),
  ]);
  const qc = new Map<string, number>(); (qs ?? []).forEach((q) => qc.set(q.lesson_id, (qc.get(q.lesson_id) ?? 0) + 1));
  const vc = new Map<string, number>(); (vs ?? []).forEach((v) => vc.set(v.lesson_id as string, (vc.get(v.lesson_id as string) ?? 0) + 1));
  const perLevel = new Map<string, number>(); (all ?? []).forEach((l) => perLevel.set(l.level, (perLevel.get(l.level) ?? 0) + 1));

  return (
    <div>
      <PageHeader title="Darslar va testlar" description="Video, so'zlar fayli, grammatika izohi va test savollarini boshqaring." actions={<NewLesson defaultLevel={level} />} />
      <div className="mb-5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {LEVELS.map((l) => (
          <Link key={l} href={`/admin/lessons?level=${l}`} className={cn("inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm", l === level ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2")}>
            {l} <span className="text-xs opacity-60">{perLevel.get(l) ?? 0}</span>
          </Link>
        ))}
      </div>
      <div className="card divide-y divide-line overflow-hidden">
        {(lessons ?? []).map((l) => (
          <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
            <MoveButtons id={l.id} />
            <span className="w-8 font-mono text-sm text-mute">{l.position}</span>
            <LevelTag level={l.level} className="hidden sm:inline-flex" />
            <Link href={`/admin/lessons/${l.id}`} className="min-w-0 flex-1">
              <div className="truncate font-medium hover:underline">{l.title}</div>
              <div className="truncate text-xs text-mute">{l.title_uz}</div>
            </Link>
            <div className="hidden items-center gap-4 text-xs text-mute md:flex">
              <span className={cn("inline-flex items-center gap-1", (l.video_url || l.video_path) ? "text-brand" : "text-faint")}><Video className="size-3.5" /> {(l.video_url || l.video_path) ? "Video" : "Videosiz"}</span>
              <span className={cn("inline-flex items-center gap-1", l.vocab_file_path ? "text-brand" : "text-faint")}><FileText className="size-3.5" /> Fayl</span>
              <span className="w-16 tabular">{qc.get(l.id) ?? 0} savol</span>
              <span className="w-14 tabular">{vc.get(l.id) ?? 0} so&apos;z</span>
            </div>
            {!l.is_published && <span className="inline-flex items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-xs text-mute"><EyeOff className="size-3" /> Qoralama</span>}
          </div>
        ))}
        {(lessons ?? []).length === 0 && <p className="p-6 text-sm text-mute">Bu darajada darslar yo&apos;q.</p>}
      </div>
    </div>
  );
}
