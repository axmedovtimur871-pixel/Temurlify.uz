import Link from "next/link";
import type { Metadata } from "next";
import { Search, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui/misc";
import { cn, formatDate } from "@/lib/utils";
import { CreateStudent, RowControls } from "./client";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Talabalar" };

export default async function StudentsPage({ searchParams }: PageProps<"/admin/students">) {
  const sp = await searchParams;
  const me = await requireStaff();
  const supabase = await supabaseServer();
  const q = typeof sp.q === "string" ? sp.q.replace(/[%,()]/g, "").trim() : "";
  const group = typeof sp.group === "string" ? sp.group : "";
  const role = typeof sp.role === "string" ? sp.role : "student";

  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(300);
  if (role !== "all") query = query.eq("role", role);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  if (group === "none") query = query.is("group_id", null);
  else if (group) query = query.eq("group_id", group);
  const [{ data }, { data: groups }] = await Promise.all([query, supabase.from("groups").select("id,name").order("name")]);
  const people = (data ?? []) as Profile[];
  const groupName = new Map((groups ?? []).map((g) => [g.id, g.name]));

  return (
    <div>
      <PageHeader title="Talabalar" description={`${people.length} ta natija`} actions={<CreateStudent groups={groups ?? []} />} />

      <form className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input name="q" defaultValue={q} placeholder="Ism, email yoki telefon…" className="h-10 w-full rounded-[10px] border border-line-strong bg-surface pl-10 pr-3 text-sm focus:border-brand focus:outline-none" />
        </div>
        <select name="group" defaultValue={group} className="h-10 rounded-[10px] border border-line-strong bg-surface px-3 text-sm">
          <option value="">Barcha guruhlar</option>
          <option value="none">Guruhsiz</option>
          {(groups ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select name="role" defaultValue={role} className="h-10 rounded-[10px] border border-line-strong bg-surface px-3 text-sm">
          <option value="student">Talabalar</option><option value="teacher">O&apos;qituvchilar</option><option value="admin">Adminlar</option><option value="all">Hammasi</option>
        </select>
        <button className="h-10 rounded-[10px] bg-ink px-4 text-sm text-paper">Filtrlash</button>
      </form>

      {people.length === 0 ? <EmptyState icon={Users} title="Hech kim topilmadi" text="Talabalar ro'yxatdan o'tganda yoki siz qo'shganingizda shu yerda ko'rinadi." /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line bg-surface-2 text-left text-[12px] uppercase tracking-wider text-mute">
              <tr><th className="px-4 py-3 font-medium">Talaba</th><th className="px-4 py-3 font-medium">Guruh</th><th className="px-4 py-3 font-medium">XP</th><th className="px-4 py-3 font-medium">Faollik</th><th className="px-4 py-3 font-medium">Holat</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {people.map((p) => (
                <tr key={p.id} className={cn(!p.is_active && "opacity-55")}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/students/${p.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar name={p.full_name} src={p.avatar_url} size={32} />
                      <span><span className="block font-medium">{p.full_name}</span><span className="text-xs text-mute">{p.email}{p.phone ? ` · ${p.phone}` : ""}</span></span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{p.group_id ? groupName.get(p.group_id) : <span className="text-faint">—</span>}</td>
                  <td className="px-4 py-3 font-mono tabular">{p.xp}</td>
                  <td className="px-4 py-3 text-xs text-mute">{p.last_active_on ? formatDate(p.last_active_on) : "—"}{p.streak > 0 && <span className="ml-1.5 text-saffron">· {p.streak} kun</span>}</td>
                  <td className="px-4 py-3">{p.role !== "student" ? <Badge tone="ink">{p.role === "admin" ? "Admin" : "O'qituvchi"}</Badge> : p.is_active ? <Badge tone="brand">Faol</Badge> : <Badge>Bloklangan</Badge>}</td>
                  <td className="px-4 py-3 text-right"><RowControls id={p.id} groupId={p.group_id} groups={groups ?? []} active={p.is_active} role={p.role} canRole={me.role === "admin" && me.id !== p.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
