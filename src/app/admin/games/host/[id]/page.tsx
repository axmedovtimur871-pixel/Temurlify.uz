import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { HostView } from "./host";
import type { GamePlayer, GameSession } from "@/lib/types";

export default async function HostPage({ params }: PageProps<"/admin/games/host/[id]">) {
  const { id } = await params;
  await requireStaff();
  const supabase = await supabaseServer();
  const [{ data: session }, { data: players }] = await Promise.all([
    supabase.from("game_sessions").select("*, game_sets(title)").eq("id", id).maybeSingle(),
    supabase.from("game_players").select("*").eq("session_id", id),
  ]);
  if (!session) notFound();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "temurlify.uz";
  return (
    <HostView
      initialSession={session as GameSession}
      initialPlayers={(players ?? []) as GamePlayer[]}
      title={(session.game_sets as { title: string } | null)?.title ?? "O'yin"}
      joinHost={host}
    />
  );
}
