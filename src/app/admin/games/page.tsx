import Link from "next/link";
import type { Metadata } from "next";
import { Gamepad2, Radio } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { EmptyState, LevelTag, PageHeader } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";
import { NewSet, StartButton } from "./client";

export const metadata: Metadata = { title: "O'yinlar" };

export default async function AdminGames() {
  const me = await requireStaff();
  const supabase = await supabaseServer();
  const [{ data: sets }, { data: qs }, { data: live }] = await Promise.all([
    supabase.from("game_sets").select("*").order("created_at", { ascending: false }),
    supabase.from("game_questions").select("set_id"),
    supabase.from("game_sessions").select("id, code, status, created_at, game_sets(title)").eq("host_id", me.id).neq("status", "finished").order("created_at", { ascending: false }),
  ]);
  const qc = new Map<string, number>(); (qs ?? []).forEach((q) => qc.set(q.set_id, (qc.get(q.set_id) ?? 0) + 1));

  return (
    <div>
      <PageHeader title="Jonli o'yinlar" description="Savollar to'plamini tanlang va o'yinni boshlang. Talabalar Game ID orqali qo'shiladi, natijalar real vaqtda yangilanadi." actions={<NewSet />} />
      {(live ?? []).length > 0 && (
        <div className="mb-6 space-y-2">
          {(live ?? []).map((s) => (
            <Link key={s.id} href={`/admin/games/host/${s.id}`} className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand-softer px-4 py-3">
              <Radio className="size-4 animate-pulse text-brand" />
              <span className="flex-1 text-sm"><strong>{(s.game_sets as unknown as { title: string } | null)?.title}</strong> — davom etmoqda</span>
              <span className="font-mono font-semibold tracking-widest">{s.code}</span>
            </Link>
          ))}
        </div>
      )}
      {(sets ?? []).length === 0 ? <EmptyState icon={Gamepad2} title="To'plamlar yo'q" text="Birinchi savollar to'plamini yarating." /> : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(sets ?? []).map((s) => (
            <li key={s.id} className="card flex flex-col p-5">
              <div className="flex items-center gap-2"><LevelTag level={s.level} /><span className="text-xs text-mute">{qc.get(s.id) ?? 0} savol · {s.seconds_per_question} s</span></div>
              <Link href={`/admin/games/${s.id}`} className="mt-3 font-medium hover:underline">{s.title}</Link>
              {s.description && <p className="mt-1 line-clamp-2 text-sm text-mute">{s.description}</p>}
              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="text-xs text-faint">{formatDate(s.created_at)}</span>
                <StartButton setId={s.id} disabled={!qc.get(s.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
