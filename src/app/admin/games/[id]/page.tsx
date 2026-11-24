import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { LevelTag, PageHeader } from "@/components/ui/misc";
import { StartButton } from "../client";
import { SetEditor } from "./editor";

export default async function GameSetPage({ params }: PageProps<"/admin/games/[id]">) {
  const { id } = await params;
  await requireStaff();
  const supabase = await supabaseServer();
  const { data: set } = await supabase.from("game_sets").select("*").eq("id", id).maybeSingle();
  if (!set) notFound();
  const { data: questions } = await supabase.from("game_questions").select("*").eq("set_id", id).order("position");
  const { data: keys } = await supabase.from("game_question_keys").select("*").in("question_id", (questions ?? []).map((q) => q.id));
  const keyMap = Object.fromEntries((keys ?? []).map((k) => [k.question_id, k.correct_index as number]));
  return (
    <div>
      <Link href="/admin/games" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"><ArrowLeft className="size-4" /> O&apos;yinlar</Link>
      <PageHeader className="mt-4" eyebrow={<LevelTag level={set.level} />} title={set.title} description={`${questions?.length ?? 0} ta savol · har biriga ${set.seconds_per_question} soniya`} actions={<StartButton setId={id} disabled={!questions?.length} />} />
      <SetEditor set={set} initial={(questions ?? []).map((q) => ({ id: q.id, prompt: q.prompt, options: q.options as string[], correct: keyMap[q.id] ?? 0 }))} />
    </div>
  );
}
