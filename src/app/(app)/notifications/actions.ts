"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export async function markAllRead() {
  const supabase = await supabaseServer();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  revalidatePath("/notifications");
}

export async function deleteNotification(id: string) {
  const supabase = await supabaseServer();
  await supabase.from("notifications").delete().eq("id", id);
  revalidatePath("/notifications");
}
