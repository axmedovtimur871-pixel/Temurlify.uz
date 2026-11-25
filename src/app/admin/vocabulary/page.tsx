import Link from "next/link";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { LEVELS, type Vocab } from "@/lib/types";
import { cn } from "@/lib/utils";
import { VocabEditor } from "../lessons/[id]/client";

export const metadata: Metadata = { title: "Lug'at" };

export default async function AdminVocabulary({ searchParams }: PageProps<"/admin/vocabulary">) {
  const sp = await searchParams;
  await requireStaff();
  const level = typeof sp.level === "string" && LEVELS.includes(sp.level as never) ? sp.level : "A1";
  const q = typeof sp.q === "string" ? sp.q.replace(/[%,()]/g, "").trim() : "";
  const supabase = await supabaseServer();
  let query = supabase.from("vocabulary").select("*", { count: "exact" }).order("de").limit(200);
  query = q ? query.or(`de.ilike.%${q}%,uz.ilike.%${q}%`) : query.eq("level", level);
  const { data, count } = await query;

  return (
    <div>
      <PageHeader title="Lug'at" description={`Talabalar lug'ati va tarjimon fallback manbasi · ${count ?? 0} ta so'z ko'rsatilmoqda`} />
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-1.5">
          {LEVELS.map((l) => (
            <Link key={l} href={`/admin/vocabulary?level=${l}`} className={cn("h-9 rounded-lg border px-3 text-sm leading-[34px]", !q && l === level ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2")}>{l}</Link>
          ))}
        </div>
        <form className="sm:ml-auto"><input name="q" defaultValue={q} placeholder="Qidirish…" className="h-9 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm sm:w-64" /></form>
      </div>
      <VocabEditor key={`${level}-${q}`} lessonId={null} level={level} initial={(data ?? []) as Vocab[]} />
    </div>
  );
}
