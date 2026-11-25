"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function reviewCard(vocabId: string, quality: number) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("review_card", { p_vocab: vocabId, p_quality: quality });
  return { data, error: error?.message };
}
