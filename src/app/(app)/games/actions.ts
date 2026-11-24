"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type JoinState = { error?: string | null } | null;

export async function joinGame(_: JoinState, form: FormData): Promise<JoinState> {
  const code = String(form.get("code") ?? "").replace(/\D/g, "");
  const nickname = String(form.get("nickname") ?? "");
  if (code.length !== 6) return { error: "Game ID 6 ta raqamdan iborat." };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("join_game", { p_code: code, p_nickname: nickname });
  if (error) return { error: error.message };
  redirect(`/games/play/${data}`);
}

export async function answerGame(sessionId: string, choice: number) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("game_answer", { p_session: sessionId, p_choice: choice });
  return { error: error?.message };
}

export async function roundStats(sessionId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("game_round_stats", { p_session: sessionId });
  return data as { counts: Record<string, number>; answered: number; mine: { answered?: boolean; choice?: number; is_correct?: boolean; points?: number } | null } | null;
}
