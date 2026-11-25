import type { Metadata } from "next";
import { AdminShell } from "@/components/shell/admin-shell";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { default: "Admin panel", template: "%s · Admin · Temurlify" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const supabase = await supabaseServer();
  const { count } = await supabase.from("homework_submissions").select("id", { count: "exact", head: true }).eq("status", "submitted");
  return <AdminShell profile={profile} toGrade={count ?? 0}>{children}</AdminShell>;
}
