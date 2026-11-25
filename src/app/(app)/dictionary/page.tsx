import type { Metadata } from "next";
import Link from "next/link";
import { BookX, Search } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { LevelTag, PageHeader } from "@/components/ui/misc";
import { cn, withArticle } from "@/lib/utils";
import { Translator, AddWordButton } from "./client";
import type { Vocab } from "@/lib/types";

export const metadata: Metadata = { title: "Lug'at va tarjimon" };

const ARTICLE_TONE = { der: "text-lvl-a2", die: "text-lvl-c1", das: "text-lvl-b1" } as const;

export default async function DictionaryPage({ searchParams }: PageProps<"/dictionary">) {
  const sp = await searchParams;
  const tab = sp.tab === "translate" ? "translate" : "dictionary";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const supabase = await supabaseServer();

  let results: Vocab[] = [];
  let total = 0;
  if (tab === "dictionary") {
    const safe = q.replace(/[%,()]/g, "");
    let query = supabase.from("vocabulary").select("*", { count: "exact" }).order("de").limit(60);
    if (safe) query = query.or(`de.ilike.%${safe}%,uz.ilike.%${safe}%`);
    const { data, count } = await query;
    results = (data ?? []) as Vocab[];
    total = count ?? 0;
    if (safe) {
      const s = safe.toLowerCase();
      results.sort((a, b) => Number(b.de.toLowerCase() === s || b.uz.toLowerCase() === s) - Number(a.de.toLowerCase() === s || a.uz.toLowerCase() === s));
    }
  }
  const { data: cards } = await supabase.from("user_cards").select("vocab_id");
  const inDeck = new Set((cards ?? []).map((c) => c.vocab_id));

  return (
    <div>
      <PageHeader eyebrow="Deutsch ⇄ O'zbekcha" title="Lug'at va tarjimon" description="Artikl, ko'plik shakli va daraja bilan so'zlarni toping yoki matnni AI yordamida tarjima qiling." />

      <div className="mb-6 inline-flex rounded-[10px] border border-line bg-surface-2 p-1">
        {[["dictionary", "Lug'at"], ["translate", "AI tarjimon"]].map(([k, l]) => (
          <Link key={k} href={`/dictionary?tab=${k}`} className={cn("rounded-lg px-4 py-1.5 text-sm transition", tab === k ? "bg-surface font-medium shadow-[var(--shadow-sm)]" : "text-mute hover:text-ink")}>{l}</Link>
        ))}
      </div>

      {tab === "translate" ? (
        <Translator />
      ) : (
        <>
          <form className="relative max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-faint" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Nemischa yoki o'zbekcha so'z… (masalan: Bahnhof, kitob)"
              className="h-14 w-full rounded-[14px] border border-line-strong bg-surface pl-12 pr-4 text-[16px] shadow-[var(--shadow-sm)] placeholder:text-faint focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12"
              autoComplete="off"
            />
          </form>
          <p className="mt-3 text-sm text-mute">{q ? `«${q}» bo'yicha ${total} ta natija` : `Lug'atda ${total} ta so'z`}</p>

          {results.length === 0 ? (
            <div className="mt-10 flex flex-col items-center text-center">
              <BookX className="size-8 text-faint" strokeWidth={1.5} />
              <p className="mt-3 font-medium">So&apos;z topilmadi</p>
              <Link href={`/dictionary?tab=translate`} className="mt-1 text-sm text-brand hover:underline">AI tarjimonda sinab ko&apos;ring</Link>
            </div>
          ) : (
            <ul className="mt-5 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {results.map((w) => (
                <li key={w.id} className="flex items-start justify-between gap-3 bg-surface p-4">
                  <div className="min-w-0">
                    <div className="text-[17px]">
                      {w.article && <span className={cn("mr-1 font-medium", ARTICLE_TONE[w.article])}>{w.article}</span>}
                      <span className="font-medium">{w.de}</span>
                    </div>
                    <div className="mt-0.5 text-sm text-ink-2">{w.uz}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-faint">
                      <LevelTag level={w.level} className="h-5 text-[10.5px]" />
                      {w.plural && <span>pl. {w.plural}</span>}
                    </div>
                    {w.example_de && <p className="mt-2 text-sm italic text-mute">{w.example_de}</p>}
                  </div>
                  <AddWordButton vocabId={w.id} label={withArticle(w)} added={inDeck.has(w.id)} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
