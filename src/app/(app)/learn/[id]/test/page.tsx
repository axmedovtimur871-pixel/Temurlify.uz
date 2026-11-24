import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { TestRunner } from "./runner";
import type { Lesson, Question } from "@/lib/types";

export const metadata: Metadata = { title: "Dars testi" };

export default async function TestPage({ params }: PageProps<"/learn/[id]/test">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const { data: lesson } = await supabase.from("lessons").select("id,title,title_uz,level,position,pass_score").eq("id", id).maybeSingle<Lesson>();
  if (!lesson) notFound();
  const { data: unlocked } = await supabase.rpc("lesson_is_unlocked", { p_user: profile.id, p_lesson: id });
  if (!unlocked && profile.role === "student") redirect("/learn");

  const [{ data: questions }, { data: passSetting }] = await Promise.all([
    supabase.from("questions").select("*").eq("lesson_id", id).order("position"),
    supabase.from("app_settings").select("value").eq("key", "pass_score").maybeSingle(),
  ]);
  return (
    <TestRunner
      lesson={{ id: lesson.id, title: lesson.title, position: lesson.position, level: lesson.level }}
      questions={(questions ?? []) as Question[]}
      passScore={lesson.pass_score ?? Number(passSetting?.value ?? 53)}
    />
  );
}
