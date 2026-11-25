import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PlayerView } from "./player";
import type { GamePlayer, GameSession } from "@/lib/types";

export const metadata: Metadata = { title: "Jonli o'yin" };

export default async function PlayPage({ params }: PageProps<"/games/play/[id]">) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const [{ data: session }, { data: players }] = await Promise.all([
    supabase.from("game_sessions").select("*").eq("id", id).maybeSingle<GameSession>(),
    supabase.from("game_players").select("*").eq("session_id", id),
  ]);
  if (!session) notFound();
  return <PlayerView initialSession={session} initialPlayers={(players ?? []) as GamePlayer[]} userId={profile.id} />;
}
