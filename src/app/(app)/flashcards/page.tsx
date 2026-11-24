import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LinkButton } from "@/components/ui/button";
import { Review } from "./review";
import type { Vocab } from "@/lib/types";

export const metadata: Metadata = { title: "Kartochkalar" };

export default async function FlashcardsPage() {
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const now = new Date().toISOString();
  const [{ data: due }, { count: total }, { count: mastered }, { data: upcoming }] = await Promise.all([
    supabase.from("user_cards").select("vocab_id, repetitions, interval_days, vocabulary(*)").eq("user_id", profile.id).lte("due_at", now).order("due_at").limit(50),
    supabase.from("user_cards").select("vocab_id", { count: "exact", head: true }).eq("user_id", profile.id),
    supabase.from("user_cards").select("vocab_id", { count: "exact", head: true }).eq("user_id", profile.id).gte("interval_days", 21),
    supabase.from("user_cards").select("due_at").eq("user_id", profile.id).gt("due_at", now).order("due_at").limit(1),
  ]);

  const cards = (due ?? []).map((c) => ({ ...(c.vocabulary as unknown as Vocab), repetitions: c.repetitions as number, interval: c.interval_days as number }));

  return (
    <div>
      <PageHeader
        eyebrow="Interval asosida takrorlash"
        title="Kartochkalar"
        description="So'zlar unutilay deganda qayta chiqadi. Har kuni bir oz takrorlash — eng samarali usul."
        actions={
          <div className="flex gap-5 text-sm">
            <div><div className="font-display text-2xl tabular">{cards.length}</div><div className="text-mute">bugun</div></div>
            <div><div className="font-display text-2xl tabular">{total ?? 0}</div><div className="text-mute">jami</div></div>
            <div><div className="font-display text-2xl tabular">{mastered ?? 0}</div><div className="text-mute">o&apos;zlashtirilgan</div></div>
          </div>
        }
      />
      {(total ?? 0) === 0 ? (
        <EmptyState
          icon={Layers}
          title="Hali kartochkalar yo'q"
          text="Dars sahifasidagi «Kartochkalarga qo'shish» tugmasi yoki lug'atdagi + belgisi orqali so'z qo'shing."
          action={<div className="flex gap-2"><LinkButton href="/learn">Darslarga o&apos;tish</LinkButton><LinkButton href="/dictionary" variant="secondary">Lug&apos;at</LinkButton></div>}
        />
      ) : cards.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Bugungi takrorlash tugadi"
          text={upcoming?.[0] ? `Keyingi kartochka: ${new Date(upcoming[0].due_at).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}` : undefined}
          action={<LinkButton href="/learn" variant="secondary">Yangi dars o&apos;rganish</LinkButton>}
        />
      ) : (
        <Review cards={cards} />
      )}
    </div>
  );
}
