import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Randomizer } from "./randomizer";

export const metadata: Metadata = { title: "Randomayzer" };

export default async function RandomizerPage() {
  await requireStaff();
  const supabase = await supabaseServer();
  const [{ data: groups }, { data: students }] = await Promise.all([
    supabase.from("groups").select("id,name").order("name"),
    supabase.from("profiles").select("id, full_name, group_id").eq("role", "student").eq("is_active", true).order("full_name"),
  ]);
  return (
    <div>
      <PageHeader title="Sinf randomayzeri" description="Javob beruvchini adolatli tanlang yoki sinfni jamoalarga bo'ling. Tanlanganlar navbat tugaguncha takrorlanmaydi." />
      <Randomizer groups={groups ?? []} students={students ?? []} />
    </div>
  );
}
