"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type TestResult = {
  score: number; correct: number; total: number; passed: boolean; pass_score: number;
  newly_passed: boolean; next_lesson: string | null;
  results: { question_id: string; correct: boolean; explanation: string | null; key?: { index?: number; indexes?: number[]; accepted?: string[] } }[];
};

export async function submitTest(lessonId: string, answers: Record<string, unknown>): Promise<{ data?: TestResult; error?: string }> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("submit_lesson_test", { p_lesson: lessonId, p_answers: answers });
  if (error) return { error: error.message };
  revalidatePath("/learn");
  revalidatePath("/dashboard");
  return { data: data as TestResult };
}

export async function markVideoWatched(lessonId: string) {
  const supabase = await supabaseServer();
  await supabase.rpc("mark_video_watched", { p_lesson: lessonId });
  revalidatePath(`/learn/${lessonId}`);
}

export async function addLessonCards(lessonId: string): Promise<{ added?: number; error?: string }> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("add_cards_from_lesson", { p_lesson: lessonId });
  if (error) return { error: error.message };
  revalidatePath("/flashcards");
  return { added: data as number };
}
