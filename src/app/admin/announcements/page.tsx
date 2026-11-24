import type { Metadata } from "next";
import { Megaphone, Pin } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { timeAgo } from "@/lib/utils";
import { AnnouncementForm, AnnouncementActions } from "./client";

export const metadata: Metadata = { title: "E'lonlar" };

export default async function AnnouncementsPage() {
  await requireStaff();
  const supabase = await supabaseServer();
  const [{ data: list }, { data: groups }] = await Promise.all([
    supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("groups").select("id,name").order("name"),
  ]);
  const gname = new Map((groups ?? []).map((g) => [g.id, g.name]));
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <PageHeader title="E'lonlar va bildirishnomalar" description="E'lon chiqarilganda auditoriyadagi har bir talabaga real vaqtda bildirishnoma boradi." />
        {(list ?? []).length === 0 ? <EmptyState icon={Megaphone} title="E'lonlar yo'q" /> : (
          <ul className="space-y-3">
            {(list ?? []).map((a) => (
              <li key={a.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">{a.pinned && <Pin className="size-4 text-saffron" />}<h3 className="font-medium">{a.title}</h3></div>
                    <p className="mt-1 whitespace-pre-line text-sm text-ink-2">{a.body}</p>
                    <p className="mt-2 text-xs text-faint">{a.group_id ? gname.get(a.group_id) : "Barcha talabalar"} · {timeAgo(a.created_at)}</p>
                  </div>
                  <AnnouncementActions id={a.id} pinned={a.pinned} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className="card h-fit p-5 lg:sticky lg:top-20">
        <h2 className="mb-4 font-medium">Yangi e&apos;lon</h2>
        <AnnouncementForm groups={groups ?? []} />
      </aside>
    </div>
  );
}
