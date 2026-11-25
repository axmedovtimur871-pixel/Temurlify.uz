"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function submitHomework(input: { homeworkId: string; text: string; filePath: string | null }) {
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const text = input.text.trim();
  if (!text && !input.filePath) return { error: "Javob yozing yoki fayl/audio qo'shing." };
  if (input.filePath && !input.filePath.startsWith(`submissions/${profile.id}/`)) return { error: "Fayl yo'li noto'g'ri." };

  const { error } = await supabase.from("homework_submissions").upsert(
    { homework_id: input.homeworkId, user_id: profile.id, text_answer: text || null, file_path: input.filePath },
    { onConflict: "homework_id,user_id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/homework");
  revalidatePath(`/homework/${input.homeworkId}`);
  return { ok: true };
}
