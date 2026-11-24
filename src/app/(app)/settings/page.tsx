import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { PasswordForm, ProfileForm, ThemePicker } from "./forms";

export const metadata: Metadata = { title: "Sozlamalar" };

export default async function SettingsPage() {
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const { data: group } = profile.group_id
    ? await supabase.from("groups").select("name").eq("id", profile.group_id).maybeSingle()
    : { data: null };
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Sozlamalar" description={`${profile.email ?? ""}${group ? ` · Guruh: ${group.name}` : ""}`} />
      <section className="card p-5 sm:p-6">
        <h2 className="mb-5 font-medium">Profil</h2>
        <ProfileForm profile={profile} />
      </section>
      <section className="card p-5 sm:p-6">
        <h2 className="mb-5 font-medium">Ko&apos;rinish</h2>
        <ThemePicker />
      </section>
      <section className="card p-5 sm:p-6">
        <h2 className="mb-5 font-medium">Parolni o&apos;zgartirish</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
