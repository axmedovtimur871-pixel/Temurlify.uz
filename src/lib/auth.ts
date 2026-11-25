import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin, hasServiceRole } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/** Current user's profile, or null. Cached per request. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await supabaseServer();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
  let profile = data as Profile | null;

  // Bootstrap: emails listed in ADMIN_EMAILS become admins on first visit.
  const email = (claims?.claims?.email as string | undefined)?.toLowerCase();
  if (profile && email && profile.role !== "admin" && adminEmails().includes(email) && hasServiceRole()) {
    const { data: promoted } = await supabaseAdmin()
      .from("profiles").update({ role: "admin" }).eq("id", uid).select("*").single();
    profile = (promoted as Profile) ?? profile;
  }
  return profile;
});

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/login?blocked=1");
  return profile;
}

export async function requireStaff() {
  const profile = await requireProfile();
  if (profile.role === "student") redirect("/dashboard");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/admin");
  return profile;
}
