"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type SettingsState = { error?: string | null; ok?: string | null } | null;

export async function updateProfile(_: SettingsState, form: FormData): Promise<SettingsState> {
  const profile = await requireProfile();
  const parsed = z.object({
    full_name: z.string().trim().min(3, "Ism kamida 3 harf"),
    phone: z.string().trim().max(20).optional(),
    target_level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
    avatar_url: z.string().url().optional().or(z.literal("")),
  }).safeParse({
    full_name: form.get("full_name"), phone: form.get("phone") || undefined,
    target_level: form.get("target_level"), avatar_url: form.get("avatar_url") || "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("profiles").update({
    full_name: parsed.data.full_name, phone: parsed.data.phone ?? null,
    target_level: parsed.data.target_level, avatar_url: parsed.data.avatar_url || null,
  }).eq("id", profile.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: "Saqlandi" };
}

export async function changePassword(_: SettingsState, form: FormData): Promise<SettingsState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Parol kamida 8 ta belgi" };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { ok: "Parol yangilandi" };
}
