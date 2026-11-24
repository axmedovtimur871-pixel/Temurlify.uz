"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { FormState } from "../actions";

export async function saveSettings(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const pass = Math.min(100, Math.max(1, Number(form.get("pass_score")) || 53));
  const goal = Math.min(1000, Math.max(10, Number(form.get("daily_xp_goal")) || 50));
  const rows = [
    { key: "pass_score", value: pass },
    { key: "daily_xp_goal", value: goal },
    { key: "platform_name", value: String(form.get("platform_name") ?? "Temurlify").trim() || "Temurlify" },
    { key: "allow_signup", value: form.get("allow_signup") === "on" },
    { key: "translator_enabled", value: form.get("translator_enabled") === "on" },
  ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));
  const supabase = await supabaseServer();
  const { error } = await supabase.from("app_settings").upsert(rows);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: "Sozlamalar saqlandi" };
}
