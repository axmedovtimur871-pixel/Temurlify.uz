import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarClock, MessageSquareText } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Badge, LevelTag } from "@/components/ui/misc";
import { SKILL_META, dueLabel, formatDate } from "@/lib/utils";
import { SubmissionForm } from "./form";
import type { Homework, Submission } from "@/lib/types";

export const metadata: Metadata = { title: "Uy vazifasi" };

export default async function HomeworkDetail({ params }: PageProps<"/homework/[id]">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const { data: hw } = await supabase.from("homework").select("*").eq("id", id).maybeSingle<Homework>();
  if (!hw) notFound();
  const { data: sub } = await supabase.from("homework_submissions").select("*").eq("homework_id", id).eq("user_id", profile.id).maybeSingle<Submission>();

  const sign = async (path: string | null, download = false) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("homework").createSignedUrl(path, 3600, download ? { download: true } : undefined);
    return data?.signedUrl ?? null;
  };
  const attachment = await sign(hw.attachment_path);
  const myFile = await sign(sub?.file_path ?? null);
  const isAudio = (p: string | null) => !!p && /\.(mp3|m4a|wav|ogg|webm|aac)$/i.test(p);
  const due = dueLabel(hw.due_at);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/homework" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"><ArrowLeft className="size-4" /> Uy vazifalari</Link>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="ink">{SKILL_META[hw.skill].de}</Badge>
        <LevelTag level={hw.level} />
        <span className="inline-flex items-center gap-1.5 text-sm text-mute"><CalendarClock className="size-4" /> {hw.due_at ? formatDate(hw.due_at, true) : "Muddatsiz"}</span>
        {!sub && hw.due_at && <Badge tone={due.tone === "danger" ? "danger" : due.tone === "warn" ? "warn" : "neutral"}>{due.text}</Badge>}
      </div>
      <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight">{hw.title}</h1>
      <p className="mt-1 text-mute">{SKILL_META[hw.skill].hint} · {hw.max_points} ball</p>

      {hw.instructions && (
        <section className="card mt-6 p-5">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-mute">Topshiriq</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-2">{hw.instructions}</p>
        </section>
      )}

      {hw.reading_text && (
        <section className="card mt-4 p-5 sm:p-7">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-mute">Matn</h2>
          <div className="mt-3 whitespace-pre-line font-display text-[1.3rem] leading-relaxed text-ink">{hw.reading_text}</div>
        </section>
      )}

      {attachment && (
        <section className="card mt-4 p-5">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-mute">{isAudio(hw.attachment_path) ? "Audio" : "Biriktirilgan fayl"}</h2>
          {isAudio(hw.attachment_path) ? (
            <audio controls src={attachment} className="mt-3 w-full" preload="metadata" />
          ) : (
            <a href={attachment} target="_blank" rel="noreferrer" className="mt-2 inline-block text-brand hover:underline">Faylni ochish</a>
          )}
        </section>
      )}

      {sub && (sub.status === "graded" || sub.status === "returned") && (
        <section className={`mt-6 rounded-[14px] border p-5 ${sub.status === "graded" ? "border-brand/30 bg-brand-softer" : "border-saffron/40 bg-saffron-soft"}`}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-medium"><MessageSquareText className="size-4" /> {sub.status === "graded" ? "O'qituvchi bahosi" : "Qayta ishlash so'raldi"}</h2>
            {sub.score !== null && <span className="font-display text-3xl tabular">{sub.score}<span className="text-lg text-mute">/{hw.max_points}</span></span>}
          </div>
          {sub.feedback && <p className="mt-2 whitespace-pre-line text-ink-2">{sub.feedback}</p>}
        </section>
      )}

      <section className="mt-6">
        <SubmissionForm
          homework={{ id: hw.id, skill: hw.skill, min_words: hw.min_words }}
          userId={profile.id}
          existing={sub ? { text: sub.text_answer ?? "", filePath: sub.file_path, fileUrl: myFile, status: sub.status, submittedAt: sub.submitted_at } : null}
        />
      </section>
    </div>
  );
}
