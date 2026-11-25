import Link from "next/link";
import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { cn, formatDate } from "@/lib/utils";
import { AttendanceSheet } from "./sheet";

export const metadata: Metadata = { title: "Davomat" };

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(new Date());

export default async function AttendancePage({ searchParams }: PageProps<"/admin/attendance">) {
  const sp = await searchParams;
  await requireStaff();
  const supabase = await supabaseServer();
  const { data: groups } = await supabase.from("groups").select("id,name").order("name");
  const groupId = typeof sp.group === "string" ? sp.group : groups?.[0]?.id;
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today();

  if (!groupId) return <div><PageHeader title="Davomat" /><EmptyState icon={CalendarCheck} title="Avval guruh yarating" action={<Link href="/admin/groups" className="text-brand hover:underline">Guruhlar</Link>} /></div>;

  const [{ data: students }, { data: session }, { data: history }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").eq("group_id", groupId).eq("role", "student").eq("is_active", true).order("full_name"),
    supabase.from("attendance_sessions").select("id, topic, attendance_records(user_id, status)").eq("group_id", groupId).eq("held_on", date).maybeSingle(),
    supabase.from("attendance_sessions").select("id, held_on, topic, attendance_records(status)").eq("group_id", groupId).order("held_on", { ascending: false }).limit(12),
  ]);
  const existing = Object.fromEntries(((session?.attendance_records ?? []) as { user_id: string; status: string }[]).map((r) => [r.user_id, r.status]));

  return (
    <div>
      <PageHeader title="Davomat" description="Har bir dars uchun talabalar davomatini belgilang. Talabalar o'z natijalarini «Natijalarim» sahifasida ko'radi." />
      <form className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(groups ?? []).map((g) => (
            <Link key={g.id} href={`/admin/attendance?group=${g.id}&date=${date}`} className={cn("h-9 shrink-0 rounded-lg border px-3 text-sm leading-[34px]", g.id === groupId ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2")}>{g.name}</Link>
          ))}
        </div>
        <input type="hidden" name="group" value={groupId} />
        <input type="date" name="date" defaultValue={date} className="h-9 rounded-lg border border-line-strong bg-surface px-3 text-sm" />
        <button className="h-9 rounded-lg bg-ink px-3 text-sm text-paper">Ochish</button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <AttendanceSheet key={`${groupId}-${date}`} groupId={groupId} date={date} topic={session?.topic ?? ""} students={students ?? []} existing={existing} />
        <aside className="card h-fit p-5">
          <h2 className="mb-3 text-[15px] font-semibold">Oxirgi darslar</h2>
          {(history ?? []).length === 0 ? <p className="text-sm text-mute">Hali yozuvlar yo&apos;q.</p> : (
            <ul className="divide-y divide-line">
              {(history ?? []).map((h) => {
                const recs = (h.attendance_records ?? []) as { status: string }[];
                const present = recs.filter((r) => r.status === "present" || r.status === "late").length;
                return (
                  <li key={h.id}>
                    <Link href={`/admin/attendance?group=${groupId}&date=${h.held_on}`} className="flex items-center justify-between py-2.5 text-sm hover:opacity-80">
                      <span><span className="block">{formatDate(h.held_on)}</span>{h.topic && <span className="text-xs text-mute">{h.topic}</span>}</span>
                      <span className="font-mono text-xs tabular">{present}/{recs.length}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
