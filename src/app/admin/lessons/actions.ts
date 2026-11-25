"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { FormState } from "../actions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const touch = (id: string) => { revalidatePath(`/admin/lessons/${id}`); revalidatePath("/admin/lessons"); revalidatePath("/learn"); };

export async function createLesson(_: FormState, form: FormData): Promise<FormState> {
  await requireStaff();
  const supabase = await supabaseServer();
  const { data: last } = await supabase.from("lessons").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  const title = str(form, "title");
  if (!title) return { error: "Sarlavha kiriting" };
  const { data, error } = await supabase.from("lessons").insert({
    title, title_uz: str(form, "title_uz") || title, level: str(form, "level") || "A1",
    position: (last?.position ?? 0) + 1, is_published: false,
  }).select("id").single();
  if (error) return { error: error.message };
  redirect(`/admin/lessons/${data.id}`);
}

export async function saveLesson(id: string, _: FormState, form: FormData): Promise<FormState> {
  await requireStaff();
  const supabase = await supabaseServer();
  const pass = str(form, "pass_score");
  const { error } = await supabase.from("lessons").update({
    title: str(form, "title"), title_uz: str(form, "title_uz"), grammar: str(form, "grammar"),
    summary: String(form.get("summary") ?? ""), level: str(form, "level"),
    duration_min: Number(str(form, "duration_min")) || 20,
    pass_score: pass ? Math.min(100, Math.max(1, Number(pass))) : null,
    is_published: form.get("is_published") === "on",
    video_url: str(form, "video_url") || null,
  }).eq("id", id);
  if (error) return { error: error.message };
  touch(id);
  return { ok: "Saqlandi" };
}

export async function setLessonFile(id: string, field: "video_path" | "vocab_file_path", path: string | null) {
  await requireStaff();
  const supabase = await supabaseServer();
  const { data: old } = await supabase.from("lessons").select(field).eq("id", id).single();
  const prev = (old as Record<string, string | null> | null)?.[field];
  if (prev && prev !== path) await supabase.storage.from("lesson-media").remove([prev]);
  const { error } = await supabase.from("lessons").update({ [field]: path }).eq("id", id);
  touch(id);
  return { error: error?.message };
}

export async function moveLesson(id: string, dir: -1 | 1) {
  await requireStaff();
  const supabase = await supabaseServer();
  const { data: cur } = await supabase.from("lessons").select("id,position").eq("id", id).single();
  if (!cur) return;
  const { data: other } = await supabase.from("lessons").select("id,position")
    .filter("position", dir < 0 ? "lt" : "gt", cur.position).order("position", { ascending: dir > 0 }).limit(1).maybeSingle();
  if (!other) return;
  // swap via a temporary slot to respect the unique constraint
  await supabase.from("lessons").update({ position: -cur.position }).eq("id", cur.id);
  await supabase.from("lessons").update({ position: cur.position }).eq("id", other.id);
  await supabase.from("lessons").update({ position: other.position }).eq("id", cur.id);
  revalidatePath("/admin/lessons");
}

export async function deleteLesson(id: string) {
  await requireStaff();
  const supabase = await supabaseServer();
  await supabase.from("lessons").delete().eq("id", id);
  revalidatePath("/admin/lessons");
  redirect("/admin/lessons");
}

// ---------------- Questions ----------------
export type QuestionInput = {
  id?: string; lesson_id: string; kind: "single" | "multi" | "text"; prompt: string; options: string[];
  explanation: string; position: number; answer: { index?: number; indexes?: number[]; accepted?: string[] };
};

export async function saveQuestion(q: QuestionInput) {
  await requireStaff();
  if (!q.prompt.trim()) return { error: "Savol matnini kiriting" };
  const options = q.kind === "text" ? [] : q.options.map((o) => o.trim()).filter(Boolean);
  if (q.kind !== "text" && options.length < 2) return { error: "Kamida 2 ta variant kerak" };
  let answer: QuestionInput["answer"];
  if (q.kind === "single") {
    if (q.answer.index === undefined || q.answer.index >= options.length) return { error: "To'g'ri javobni belgilang" };
    answer = { index: q.answer.index };
  } else if (q.kind === "multi") {
    const idx = (q.answer.indexes ?? []).filter((i) => i < options.length);
    if (!idx.length) return { error: "Kamida bitta to'g'ri javob belgilang" };
    answer = { indexes: idx };
  } else {
    const acc = (q.answer.accepted ?? []).map((a) => a.trim()).filter(Boolean);
    if (!acc.length) return { error: "Qabul qilinadigan javob kiriting" };
    answer = { accepted: acc };
  }
  const supabase = await supabaseServer();
  const row = { lesson_id: q.lesson_id, kind: q.kind, prompt: q.prompt.trim(), options, explanation: q.explanation.trim() || null, position: q.position };
  const { data, error } = q.id
    ? await supabase.from("questions").update(row).eq("id", q.id).select("id").single()
    : await supabase.from("questions").insert(row).select("id").single();
  if (error) return { error: error.message };
  const { error: kErr } = await supabase.from("question_keys").upsert({ question_id: data.id, answer });
  if (kErr) return { error: kErr.message };
  touch(q.lesson_id);
  return { id: data.id as string };
}

export async function deleteQuestion(id: string, lessonId: string) {
  await requireStaff();
  const supabase = await supabaseServer();
  await supabase.from("questions").delete().eq("id", id);
  touch(lessonId);
}

// ---------------- Vocabulary ----------------
export type VocabInput = { id?: string; lesson_id: string | null; level: string; de: string; article: string | null; plural: string | null; uz: string; example_de: string | null; part_of_speech?: string };

export async function saveVocab(v: VocabInput) {
  await requireStaff();
  if (!v.de.trim() || !v.uz.trim()) return { error: "Nemischa va o'zbekcha maydonlar majburiy" };
  const supabase = await supabaseServer();
  const row = {
    lesson_id: v.lesson_id, level: v.level, de: v.de.trim(), uz: v.uz.trim(),
    article: v.article && ["der", "die", "das"].includes(v.article) ? v.article : null,
    plural: v.plural?.trim() || null, example_de: v.example_de?.trim() || null,
    part_of_speech: v.part_of_speech || (v.article ? "noun" : "word"),
  };
  const { data, error } = v.id
    ? await supabase.from("vocabulary").update(row).eq("id", v.id).select("id").single()
    : await supabase.from("vocabulary").insert(row).select("id").single();
  if (v.lesson_id) touch(v.lesson_id);
  revalidatePath("/admin/vocabulary");
  return { error: error?.message, id: data?.id as string | undefined };
}

export async function deleteVocab(id: string, lessonId: string | null) {
  await requireStaff();
  const supabase = await supabaseServer();
  await supabase.from("vocabulary").delete().eq("id", id);
  if (lessonId) touch(lessonId);
  revalidatePath("/admin/vocabulary");
}

/** Bulk import. Each line: "der Tisch, Tische; stol" or "lernen; o'rganmoq". */
export async function importVocab(lessonId: string | null, level: string, text: string) {
  await requireStaff();
  const rows = text.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
    const [dePart, uz, example] = line.split(/[;\t]/).map((s) => s?.trim());
    const m = dePart?.match(/^(der|die|das)\s+(.+)$/i);
    const [lemma, plural] = (m ? m[2] : dePart ?? "").split(",").map((s) => s.trim());
    return {
      lesson_id: lessonId, level, de: lemma, uz: uz ?? "", article: m ? m[1].toLowerCase() : null,
      plural: plural || null, example_de: example || null, part_of_speech: m ? "noun" : "word",
    };
  }).filter((r) => r.de && r.uz);
  if (!rows.length) return { error: "Format: «der Tisch, Tische; stol» — har bir qatorda bitta so'z" };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("vocabulary").insert(rows);
  if (lessonId) touch(lessonId);
  revalidatePath("/admin/vocabulary");
  return { error: error?.message, count: rows.length };
}
