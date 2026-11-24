"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import type { FormState } from "../actions";

export async function createAnnouncement(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireStaff();
  const title = String(form.get("title") ?? "").trim();
  if (!title) return { error: "Sarlavha kiriting" };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("announcements").insert({
    title, body: String(form.get("body") ?? "").trim(), group_id: String(form.get("group_id") ?? "") || null,
    pinned: form.get("pinned") === "on", created_by: me.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/announcements");
  return { ok: "E'lon chiqarildi va talabalarga yuborildi" };
}

export async function togglePin(id: string, pinned: boolean) {
  await requireStaff();
  const supabase = await supabaseServer();
  await supabase.from("announcements").update({ pinned }).eq("id", id);
  revalidatePath("/admin/announcements");
}

export async function deleteAnnouncement(id: string) {
  await requireStaff();
  const supabase = await supabaseServer();
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/admin/announcements");
}
