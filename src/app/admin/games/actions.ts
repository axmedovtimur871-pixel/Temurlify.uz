"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { FormState } from "../actions";

export async function createSet(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireStaff();
  const title = String(form.get("title") ?? "").trim();
  if (!title) return { error: "Nom kiriting" };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("game_sets").insert({
    title, level: String(form.get("level") ?? "A1"), description: String(form.get("description") ?? ""),
    seconds_per_question: Number(form.get("seconds")) || 20, created_by: me.id,
  }).select("id").single();
  if (error) return { error: error.message };
  redirect(`/admin/games/${data.id}`);
}

export async function updateSet(id: string, patch: { title?: string; seconds_per_question?: number; level?: string }) {
  await requireStaff();
  const supabase = await supabaseServer();
  await supabase.from("game_sets").update(patch).eq("id", id);
  revalidatePath(`/admin/games/${id}`);
}

export async function deleteSet(id: string) {
  await requireStaff();
  const supabase = await supabaseServer();
  await supabase.from("game_sets").delete().eq("id", id);
  revalidatePath("/admin/games");
  redirect("/admin/games");
}

export async function saveGameQuestion(q: { id?: string; set_id: string; prompt: string; options: string[]; correct: number; position: number }) {
  await requireStaff();
  const options = q.options.map((o) => o.trim()).filter(Boolean);
  if (!q.prompt.trim()) return { error: "Savol kiriting" };
  if (options.length < 2 || options.length > 4) return { error: "2–4 ta variant kerak" };
  if (q.correct < 0 || q.correct >= options.length) return { error: "To'g'ri javobni belgilang" };
  const supabase = await supabaseServer();
  const row = { set_id: q.set_id, prompt: q.prompt.trim(), options, position: q.position };
  const { data, error } = q.id
    ? await supabase.from("game_questions").update(row).eq("id", q.id).select("id").single()
    : await supabase.from("game_questions").insert(row).select("id").single();
  if (error) return { error: error.message };
  const { error: e2 } = await supabase.from("game_question_keys").upsert({ question_id: data.id, correct_index: q.correct });
  revalidatePath(`/admin/games/${q.set_id}`);
  return { error: e2?.message, id: data.id as string };
}

export async function deleteGameQuestion(id: string, setId: string) {
  await requireStaff();
  const supabase = await supabaseServer();
  await supabase.from("game_questions").delete().eq("id", id);
  revalidatePath(`/admin/games/${setId}`);
}

/** Builds a game set from lesson vocabulary: "«uz» nemischa?" with 4 options. */
export async function generateFromLessons(setId: string, level: string, count: number) {
  await requireStaff();
  const supabase = await supabaseServer();
  const { data: words } = await supabase.from("vocabulary").select("de, article, uz").eq("level", level).limit(500);
  if (!words || words.length < 4) return { error: "Bu darajada so'zlar yetarli emas" };
  const shuffle = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
  const label = (w: { de: string; article: string | null }) => (w.article ? `${w.article} ${w.de}` : w.de);
  const { count: existing } = await supabase.from("game_questions").select("id", { count: "exact", head: true }).eq("set_id", setId);
  const picked = shuffle(words).slice(0, Math.min(count, 30));
  for (const [i, w] of picked.entries()) {
    const options = shuffle([label(w), ...shuffle(words.filter((x) => x.de !== w.de)).slice(0, 3).map(label)]);
    const { data } = await supabase.from("game_questions").insert({ set_id: setId, prompt: `«${w.uz}» nemis tilida qanday?`, options, position: (existing ?? 0) + i }).select("id").single();
    if (data) await supabase.from("game_question_keys").insert({ question_id: data.id, correct_index: options.indexOf(label(w)) });
  }
  revalidatePath(`/admin/games/${setId}`);
  return { count: picked.length };
}

export async function startGame(setId: string) {
  await requireStaff();
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("create_game", { p_set: setId });
  if (error) return { error: error.message };
  redirect(`/admin/games/host/${(data as { id: string }).id}`);
}

export async function hostNext(sessionId: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("game_next", { p_session: sessionId });
  return { error: error?.message };
}

export async function hostReveal(sessionId: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("game_reveal", { p_session: sessionId });
  return { error: error?.message };
}

export async function hostStats(sessionId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("game_round_stats", { p_session: sessionId });
  return data as { counts: Record<string, number>; answered: number } | null;
}

export async function kickPlayer(playerId: string) {
  await requireStaff();
  const supabase = await supabaseServer();
  await supabase.from("game_players").delete().eq("id", playerId);
}
