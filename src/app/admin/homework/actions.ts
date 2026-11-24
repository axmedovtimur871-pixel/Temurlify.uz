"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { FormState } from "../actions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function saveHomework(id: string | null, _: FormState, form: FormData): Promise<FormState> {
  const me = await requireStaff();
  const title = str(form, "title");
  if (!title) return { error: "Sarlavha kiriting" };
  const due = str(form, "due_at");
  const row = {
    title, skill: str(form, "skill"), instructions: str(form, "instructions"),
    reading_text: str(form, "reading_text") || null, attachment_path: str(form, "attachment_path") || null,
    group_id: str(form, "group_id") || null, lesson_id: str(form, "lesson_id") || null, level: str(form, "level") || "A1",
    min_words: Number(str(form, "min_words")) || null, max_points: Number(str(form, "max_points")) || 100,
    // datetime-local is entered in Tashkent time (UTC+5)
    due_at: due ? new Date(`${due}:00+05:00`).toISOString() : null,
    is_published: form.get("is_published") === "on",
  };
  const supabase = await supabaseServer();
  const { data, error } = id
    ? await supabase.from("homework").update(row).eq("id", id).select("id").single()
    : await supabase.from("homework").insert({ ...row, created_by: me.id }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/admin/homework");
  revalidatePath("/homework");
  if (!id) redirect(`/admin/homework/${data.id}`);
  return { ok: "Saqlandi" };
}

export async function deleteHomework(id: string) {
  await requireStaff();
  const supabase = await supabaseServer();
  const { data } = await supabase.from("homework").select("attachment_path").eq("id", id).single();
  if (data?.attachment_path) await supabase.storage.from("homework").remove([data.attachment_path]);
  await supabase.from("homework").delete().eq("id", id);
  revalidatePath("/admin/homework");
  redirect("/admin/homework");
}

export async function gradeSubmission(input: { id: string; homeworkId: string; score: number | null; feedback: string; status: "graded" | "returned" }) {
  await requireStaff();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("homework_submissions").update({
    score: input.status === "graded" ? input.score : null, feedback: input.feedback.trim() || null, status: input.status,
  }).eq("id", input.id);
  revalidatePath(`/admin/homework/${input.homeworkId}`);
  revalidatePath("/admin");
  return { error: error?.message };
}
