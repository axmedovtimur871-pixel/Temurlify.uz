import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { LevelTag } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { DetailsForm, MediaPanel, QuestionsEditor, VocabEditor, DeleteLesson } from "./client";
import type { Lesson, Question, Vocab } from "@/lib/types";

const TABS = [["details", "Ma'lumot"], ["media", "Video va fayl"], ["questions", "Test savollari"], ["vocab", "So'zlar"]] as const;

export default async function LessonEditor({ params, searchParams }: PageProps<"/admin/lessons/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const tab = (TABS.find(([k]) => k === sp.tab)?.[0] ?? "details") as (typeof TABS)[number][0];
  await requireStaff();
  const supabase = await supabaseServer();
  const { data: lesson } = await supabase.from("lessons").select("*").eq("id", id).maybeSingle<Lesson>();
  if (!lesson) notFound();

  const [{ data: questions }, { data: keys }, { data: vocab }, { count: qn }, { count: vn }] = await Promise.all([
    tab === "questions" ? supabase.from("questions").select("*").eq("lesson_id", id).order("position") : Promise.resolve({ data: [] }),
    tab === "questions" ? supabase.rpc("staff_question_keys", { p_lesson: id }) : Promise.resolve({ data: [] }),
    tab === "vocab" ? supabase.from("vocabulary").select("*").eq("lesson_id", id).order("created_at") : Promise.resolve({ data: [] }),
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("lesson_id", id),
    supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("lesson_id", id),
  ]);

  const sign = async (p: string | null) => p ? (await supabase.storage.from("lesson-media").createSignedUrl(p, 3600)).data?.signedUrl ?? null : null;
  const keyMap = Object.fromEntries(((keys ?? []) as { question_id: string; answer: Record<string, unknown> }[]).map((k) => [k.question_id, k.answer]));

  return (
    <div>
      <Link href={`/admin/lessons?level=${lesson.level}`} className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"><ArrowLeft className="size-4" /> Darslar</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><LevelTag level={lesson.level} /><span className="font-mono text-sm text-mute">{lesson.position}-dars</span>{!lesson.is_published && <span className="rounded-full bg-sunken px-2 py-0.5 text-xs text-mute">Qoralama</span>}</div>
          <h1 className="mt-2 font-display text-4xl tracking-tight">{lesson.title}</h1>
          <p className="text-mute">{lesson.title_uz}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/learn/${lesson.id}`} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm text-ink-2 hover:bg-surface-2"><ExternalLink className="size-4" /> Talaba ko&apos;rinishi</Link>
          <DeleteLesson id={lesson.id} />
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin/lessons/${id}?tab=${k}`} className={cn("-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm", tab === k ? "border-brand font-medium text-ink" : "border-transparent text-mute hover:text-ink")}>
            {l}{k === "questions" && <span className="ml-1.5 text-xs text-faint">{qn ?? 0}</span>}{k === "vocab" && <span className="ml-1.5 text-xs text-faint">{vn ?? 0}</span>}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {tab === "details" && <DetailsForm lesson={lesson} />}
        {tab === "media" && <MediaPanel lesson={lesson} videoSigned={await sign(lesson.video_path)} fileSigned={await sign(lesson.vocab_file_path)} />}
        {tab === "questions" && <QuestionsEditor lessonId={id} initial={(questions ?? []) as Question[]} keys={keyMap} />}
        {tab === "vocab" && <VocabEditor lessonId={id} level={lesson.level} initial={(vocab ?? []) as Vocab[]} />}
      </div>
    </div>
  );
}
