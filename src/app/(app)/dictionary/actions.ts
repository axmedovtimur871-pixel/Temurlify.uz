"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export async function addCard(vocabId: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("add_card", { p_vocab: vocabId });
  revalidatePath("/flashcards");
  return { error: error?.message };
}
