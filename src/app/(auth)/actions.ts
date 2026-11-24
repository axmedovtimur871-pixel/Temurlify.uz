"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export type AuthState = { error?: string | null; ok?: string | null } | null;

const translate = (msg: string) => {
  if (/invalid login/i.test(msg)) return "Email yoki parol noto'g'ri.";
  if (/email not confirmed/i.test(msg)) return "Email tasdiqlanmagan. Pochtangizdagi havolani bosing.";
  if (/already registered|already exists/i.test(msg)) return "Bu email bilan hisob allaqachon mavjud.";
  if (/rate limit/i.test(msg)) return "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.";
  if (/password/i.test(msg) && /characters/i.test(msg)) return "Parol kamida 8 ta belgidan iborat bo'lsin.";
  return msg;
};

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
}

const safeNext = (next: unknown) =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z.object({ email: z.email(), password: z.string().min(1) }).safeParse({
    email: String(form.get("email") ?? "").trim(),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: "Email va parolni to'g'ri kiriting." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: translate(error.message) };
  redirect(safeNext(form.get("next")));
}

export async function register(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      full_name: z.string().trim().min(3, "Ism va familiyangizni kiriting."),
      phone: z.string().trim().max(20).optional(),
      email: z.email("Email noto'g'ri."),
      password: z.string().min(8, "Parol kamida 8 ta belgi."),
    })
    .safeParse({
      full_name: form.get("full_name"),
      phone: form.get("phone") || undefined,
      email: String(form.get("email") ?? "").trim(),
      password: form.get("password"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri." };

  const supabase = await supabaseServer();
  const { data: setting } = await supabase.from("app_settings").select("value").eq("key", "allow_signup").maybeSingle();
  if (setting && setting.value === false) {
    return { error: "Ro'yxatdan o'tish vaqtincha yopiq. O'qituvchingizga murojaat qiling." };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name, phone: parsed.data.phone ?? null },
      emailRedirectTo: `${await origin()}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { error: translate(error.message) };
  if (!data.session) return { ok: "Hisob yaratildi! Emailingizga tasdiqlash havolasi yuborildi." };
  redirect("/dashboard");
}

export async function forgotPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!z.email().safeParse(email).success) return { error: "Email noto'g'ri." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/auth/reset`,
  });
  if (error) return { error: translate(error.message) };
  return { ok: "Agar bu email ro'yxatda bo'lsa, parolni tiklash havolasi yuborildi." };
}

export async function updatePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Parol kamida 8 ta belgi." };
  if (password !== form.get("confirm")) return { error: "Parollar mos kelmadi." };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: translate(error.message) };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
