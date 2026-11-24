"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { hasServiceRole, supabaseAdmin } from "@/lib/supabase/admin";

export type FormState = { error?: string | null; ok?: string | null } | null;
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const optUuid = (v: string) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

// ---------------- Students ----------------
export async function createStudent(_: FormState, form: FormData): Promise<FormState> {
  await requireStaff();
  if (!hasServiceRole()) return { error: "SUPABASE_SERVICE_ROLE_KEY sozlanmagan — talabalar o'zlari ro'yxatdan o'tishi mumkin." };
  const parsed = z.object({
    full_name: z.string().min(3, "Ism kiriting"), email: z.email("Email noto'g'ri"),
    password: z.string().min(8, "Parol kamida 8 belgi"), phone: z.string().optional(), group_id: z.string().optional(),
  }).safeParse({ full_name: str(form, "full_name"), email: str(form, "email"), password: str(form, "password"), phone: str(form, "phone") || undefined, group_id: str(form, "group_id") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email, password: parsed.data.password, email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name, phone: parsed.data.phone ?? null },
  });
  if (error) return { error: error.message.includes("already") ? "Bu email bilan hisob mavjud" : error.message };
  if (parsed.data.group_id) await admin.from("profiles").update({ group_id: optUuid(parsed.data.group_id) }).eq("id", data.user.id);
  revalidatePath("/admin/students");
  return { ok: `${parsed.data.full_name} qo'shildi. Kirish: ${parsed.data.email}` };
}

export async function updateStudent(id: string, patch: { group_id?: string | null; is_active?: boolean; role?: "student" | "teacher" | "admin" }) {
  const me = await requireStaff();
  if (patch.role && me.role !== "admin") return { error: "Rolni faqat administrator o'zgartiradi" };
  if (patch.role && id === me.id) return { error: "O'z rolingizni o'zgartira olmaysiz" };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${id}`);
  return { error: error?.message };
}

export async function resetStudentPassword(id: string, password: string) {
  await requireStaff();
  if (password.length < 8) return { error: "Parol kamida 8 belgi" };
  if (!hasServiceRole()) return { error: "SUPABASE_SERVICE_ROLE_KEY sozlanmagan" };
  const { error } = await supabaseAdmin().auth.admin.updateUserById(id, { password });
  return { error: error?.message, ok: error ? undefined : "Parol yangilandi" };
}

export async function deleteStudent(id: string) {
  const me = await requireAdmin();
  if (id === me.id) return;
  if (hasServiceRole()) await supabaseAdmin().auth.admin.deleteUser(id);
  revalidatePath("/admin/students");
  redirect("/admin/students");
}

export async function unlockLesson(userId: string, lessonId: string, unlock: boolean) {
  await requireStaff();
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("staff_unlock_lesson", { p_user: userId, p_lesson: lessonId, p_unlock: unlock });
  revalidatePath(`/admin/students/${userId}`);
  return { error: error?.message };
}

// ---------------- Groups ----------------
export async function saveGroup(_: FormState, form: FormData): Promise<FormState> {
  await requireStaff();
  const name = str(form, "name");
  if (!name) return { error: "Guruh nomini kiriting" };
  const row = { name, level: str(form, "level") || "A1", schedule: str(form, "schedule") || null };
  const supabase = await supabaseServer();
  const id = optUuid(str(form, "id"));
  const { error } = id ? await supabase.from("groups").update(row).eq("id", id) : await supabase.from("groups").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/groups");
  return { ok: "Saqlandi" };
}

export async function deleteGroup(id: string) {
  await requireStaff();
  const supabase = await supabaseServer();
  await supabase.from("groups").delete().eq("id", id);
  revalidatePath("/admin/groups");
}
