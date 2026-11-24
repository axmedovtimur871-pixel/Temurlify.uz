"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

type Status = "present" | "late" | "absent" | "excused";

export async function saveAttendance(input: { groupId: string; date: string; topic: string; records: Record<string, Status> }) {
  const me = await requireStaff();
  const supabase = await supabaseServer();
  const { data: session, error } = await supabase.from("attendance_sessions")
    .upsert({ group_id: input.groupId, held_on: input.date, topic: input.topic || null, created_by: me.id }, { onConflict: "group_id,held_on" })
    .select("id").single();
  if (error) return { error: error.message };
  const rows = Object.entries(input.records).map(([user_id, status]) => ({ session_id: session.id, user_id, status }));
  if (rows.length) {
    const { error: e2 } = await supabase.from("attendance_records").upsert(rows, { onConflict: "session_id,user_id" });
    if (e2) return { error: e2.message };
  }
  revalidatePath("/admin/attendance");
  return { ok: true };
}
