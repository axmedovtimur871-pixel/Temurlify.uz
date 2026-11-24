import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { HomeworkForm } from "../form";

export default async function NewHomework() {
  await requireStaff();
  const supabase = await supabaseServer();
  const [{ data: groups }, { data: lessons }] = await Promise.all([
    supabase.from("groups").select("id,name").order("name"),
    supabase.from("lessons").select("id,position,title").order("position"),
  ]);
  return (
    <div>
      <Link href="/admin/homework" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"><ArrowLeft className="size-4" /> Uy vazifalari</Link>
      <PageHeader title="Yangi uy vazifasi" className="mt-4" />
      <HomeworkForm groups={groups ?? []} lessons={lessons ?? []} />
    </div>
  );
}
