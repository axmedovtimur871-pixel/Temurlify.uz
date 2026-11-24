import type { Metadata } from "next";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState, LevelTag, PageHeader } from "@/components/ui/misc";
import { GroupForm, DeleteGroup } from "./client";

export const metadata: Metadata = { title: "Guruhlar" };

export default async function GroupsPage() {
  await requireStaff();
  const supabase = await supabaseServer();
  const [{ data: groups }, { data: members }] = await Promise.all([
    supabase.from("groups").select("*").order("name"),
    supabase.from("profiles").select("group_id").eq("role", "student").not("group_id", "is", null),
  ]);
  const counts = new Map<string, number>();
  (members ?? []).forEach((m) => counts.set(m.group_id as string, (counts.get(m.group_id as string) ?? 0) + 1));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div>
        <PageHeader title="Guruhlar" description="Talabalarni guruhlarga ajrating: vazifalar, e'lonlar va reyting guruh bo'yicha ishlaydi." />
        {(groups ?? []).length === 0 ? <EmptyState icon={UsersRound} title="Guruhlar yo'q" text="O'ngdagi forma orqali birinchi guruhni yarating." /> : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(groups ?? []).map((g) => (
              <li key={g.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2"><LevelTag level={g.level} /><h3 className="font-medium">{g.name}</h3></div>
                    {g.schedule && <p className="mt-1.5 text-sm text-mute">{g.schedule}</p>}
                  </div>
                  <DeleteGroup id={g.id} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <Link href={`/admin/students?group=${g.id}`} className="text-brand hover:underline">{counts.get(g.id) ?? 0} ta talaba</Link>
                  <GroupForm group={g} compact />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className="card h-fit p-5 lg:sticky lg:top-20">
        <h2 className="mb-4 font-medium">Yangi guruh</h2>
        <GroupForm />
      </aside>
    </div>
  );
}
