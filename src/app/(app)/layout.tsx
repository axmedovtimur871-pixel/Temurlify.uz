import { AppShell } from "@/components/shell/app-shell";
import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return <AppShell profile={profile} unread={count ?? 0}>{children}</AppShell>;
}
