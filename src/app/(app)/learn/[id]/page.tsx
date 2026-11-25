import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Download, FileQuestion, Lock, VideoOff } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { LinkButton } from "@/components/ui/button";
import { Badge, LevelTag, SectionTitle } from "@/components/ui/misc";
import { embedUrl, renderMarkdown, withArticle } from "@/lib/utils";
import { VideoPlayer, AddCardsButton } from "./client";
import type { Lesson, Vocab } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/learn/[id]">): Promise<Metadata> {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data } = await supabase.from("lessons").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "Dars" };
}

export default async function LessonPage({ params }: PageProps<"/learn/[id]">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await supabaseServer();

  const { data: lesson } = await supabase.from("lessons").select("*").eq("id", id).maybeSingle<Lesson>();
  if (!lesson) notFound();

  const { data: unlocked } = await supabase.rpc("lesson_is_unlocked", { p_user: profile.id, p_lesson: id });
  if (!unlocked && profile.role === "student") redirect("/learn");

  const [{ data: vocab }, { data: progress }, { count: qCount }, { data: neighbours }, { data: passSetting }] = await Promise.all([
    supabase.from("vocabulary").select("*").eq("lesson_id", id).order("created_at"),
    supabase.from("lesson_progress").select("*").eq("lesson_id", id).eq("user_id", profile.id).maybeSingle(),
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("lesson_id", id),
    supabase.from("lessons").select("id,position,title").eq("is_published", true).in("position", [lesson.position - 1, lesson.position + 1]),
    supabase.from("app_settings").select("value").eq("key", "pass_score").maybeSingle(),
  ]);

  const passScore = lesson.pass_score ?? Number(passSetting?.value ?? 53);
  let videoSrc: string | null = null;
  if (lesson.video_path) {
    const { data } = await supabase.storage.from("lesson-media").createSignedUrl(lesson.video_path, 60 * 60 * 4);
    videoSrc = data?.signedUrl ?? null;
  }
  let vocabFile: string | null = null;
  if (lesson.vocab_file_path) {
    const { data } = await supabase.storage.from("lesson-media").createSignedUrl(lesson.vocab_file_path, 60 * 60, { download: true });
    vocabFile = data?.signedUrl ?? null;
  }
  const embed = lesson.video_url ? embedUrl(lesson.video_url) : null;
  const prev = neighbours?.find((n) => n.position === lesson.position - 1);
  const next = neighbours?.find((n) => n.position === lesson.position + 1);
  const words = (vocab ?? []) as Vocab[];

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/learn?level=${lesson.level}`} className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink">
          <ArrowLeft className="size-4" /> Darslar
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <LevelTag level={lesson.level} />
          <span className="font-mono text-sm text-mute">{lesson.position}-dars · {lesson.duration_min} daqiqa</span>
          {progress?.passed && <Badge tone="brand">Tugatilgan · {progress.best_score}%</Badge>}
        </div>
        <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight sm:text-5xl">{lesson.title}</h1>
        <p className="mt-2 text-lg text-ink-2">{lesson.title_uz}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          {videoSrc || embed ? (
            <VideoPlayer lessonId={lesson.id} src={videoSrc} embed={embed} watched={Boolean(progress?.video_watched)} />
          ) : (
            <div className="grid aspect-video place-items-center rounded-[14px] border border-dashed border-line-strong bg-surface-2 text-center">
              <div>
                <VideoOff className="mx-auto size-8 text-faint" strokeWidth={1.5} />
                <p className="mt-3 font-medium">Video hali yuklanmagan</p>
                <p className="mt-1 text-sm text-mute">O&apos;qituvchi videoni qo&apos;shganda shu yerda paydo bo&apos;ladi.</p>
              </div>
            </div>
          )}

          <article className="card p-5 sm:p-7">
            <div className="prose-tm" dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.summary || "") }} />
          </article>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-2 text-sm text-mute"><FileQuestion className="size-4" /> Dars testi</div>
              <div className="mt-2 font-display text-2xl">{qCount ?? 0} ta savol</div>
              <p className="mt-1 text-sm text-mute">O&apos;tish bali: <strong className="text-ink">{passScore}%</strong>. Urinishlar cheklanmagan.</p>
              {progress && progress.attempts > 0 && (
                <p className="mt-3 text-sm">Eng yaxshi natija: <span className={progress.passed ? "font-semibold text-brand" : "font-semibold text-danger"}>{progress.best_score}%</span> <span className="text-mute">· {progress.attempts} urinish</span></p>
              )}
            </div>
            <div className="border-t border-line bg-surface-2 p-4">
              <LinkButton href={`/learn/${lesson.id}/test`} className="w-full" size="lg">
                {progress?.passed ? "Testni qayta topshirish" : "Testni boshlash"} <ArrowRight className="size-4" />
              </LinkButton>
            </div>
          </div>

          <div className="card p-5">
            <SectionTitle action={vocabFile && (
              <a href={vocabFile} className="inline-flex items-center gap-1.5 text-[13px] text-brand hover:underline"><Download className="size-3.5" /> Fayl</a>
            )}>Yangi so&apos;zlar · {words.length}</SectionTitle>
            {words.length === 0 ? (
              <p className="text-sm text-mute">Bu darsga so&apos;zlar hali qo&apos;shilmagan.</p>
            ) : (
              <>
                <ul className="divide-y divide-line">
                  {words.map((w) => (
                    <li key={w.id} className="flex items-baseline justify-between gap-4 py-2.5">
                      <span>
                        <span className="font-medium">{withArticle(w)}</span>
                        {w.plural && <span className="ml-1.5 text-xs text-faint">pl. {w.plural}</span>}
                      </span>
                      <span className="text-right text-sm text-mute">{w.uz}</span>
                    </li>
                  ))}
                </ul>
                <AddCardsButton lessonId={lesson.id} />
              </>
            )}
          </div>

          <div className="flex gap-2">
            {prev ? (
              <LinkButton href={`/learn/${prev.id}`} variant="secondary" className="flex-1"><ArrowLeft className="size-4" /> Oldingi</LinkButton>
            ) : <span className="flex-1" />}
            {next && (
              progress?.passed || profile.role !== "student"
                ? <LinkButton href={`/learn/${next.id}`} variant="secondary" className="flex-1">Keyingi <ArrowRight className="size-4" /></LinkButton>
                : <span className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] border border-line text-sm text-faint"><Lock className="size-3.5" /> Keyingi</span>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
