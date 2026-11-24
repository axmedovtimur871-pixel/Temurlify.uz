"use client";

import { useCallback, useEffect, useState } from "react";
import { PartyPopper, RotateCcw, Volume2 } from "lucide-react";
import { reviewCard } from "./actions";
import { LinkButton } from "@/components/ui/button";
import { Progress } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { Vocab } from "@/lib/types";

type Card = Vocab & { repetitions: number; interval: number };

const GRADES = [
  { q: 0, label: "Unutdim", key: "1", cls: "hover:border-danger hover:text-danger" },
  { q: 3, label: "Qiyin", key: "2", cls: "hover:border-saffron hover:text-[color-mix(in_oklab,var(--saffron)_70%,var(--ink))]" },
  { q: 4, label: "Yaxshi", key: "3", cls: "hover:border-brand hover:text-brand" },
  { q: 5, label: "Oson", key: "4", cls: "hover:border-info hover:text-info" },
];

const ARTICLE = { der: "text-lvl-a2", die: "text-lvl-c1", das: "text-lvl-b1" } as const;

function nextLabel(card: Card, q: number) {
  if (q < 3) return "10 daq";
  const reps = card.repetitions + 1;
  const days = reps === 1 ? 1 : reps === 2 ? (q === 5 ? 4 : 3) : Math.round(card.interval * 2.5 * (q === 5 ? 1.3 : 1));
  return `${days} kun`;
}

export function Review({ cards: initial }: { cards: Card[] }) {
  const [queue, setQueue] = useState(initial);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const card = queue[0];

  const speak = useCallback(() => {
    if (!card || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(card.article ? `${card.article} ${card.de}` : card.de);
    u.lang = "de-DE"; u.rate = 0.85;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }, [card]);

  const grade = useCallback((q: number) => {
    if (!card || !flipped) return;
    reviewCard(card.id, q);
    setFlipped(false);
    setQueue((cur) => {
      const [first, ...rest] = cur;
      return q < 3 ? [...rest, first] : rest; // forgotten cards come back in this session
    });
    if (q >= 3) setDone((d) => d + 1);
  }, [card, flipped]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      const g = GRADES.find((x) => x.key === e.key);
      if (g) grade(g.q);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [grade]);

  if (!card) {
    return (
      <div className="card mx-auto max-w-lg animate-pop p-10 text-center">
        <PartyPopper className="mx-auto size-10 text-saffron" strokeWidth={1.5} />
        <h2 className="mt-4 font-display text-3xl">Barakalla!</h2>
        <p className="mt-2 text-mute">{done} ta kartochka takrorlandi. Ertaga yana ko&apos;rishamiz.</p>
        <LinkButton href="/dashboard" className="mt-6">Bosh sahifaga</LinkButton>
      </div>
    );
  }

  const total = done + queue.length;
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center gap-3">
        <Progress value={(done / Math.max(1, total)) * 100} className="flex-1" />
        <span className="font-mono text-sm text-mute tabular">{done}/{total}</span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="group relative block h-80 w-full [perspective:1200px]"
        aria-label={flipped ? "Kartochka orqa tomoni" : "Kartochkani ochish"}
      >
        <div className={cn("relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]", flipped && "[transform:rotateY(180deg)]")}>
          <div className="card absolute inset-0 flex flex-col items-center justify-center p-8 shadow-[var(--shadow-md)] [backface-visibility:hidden]">
            <span className="absolute left-5 top-4 font-mono text-xs text-faint">{card.level}</span>
            <div className="font-display text-5xl leading-tight sm:text-6xl">
              {card.article && <span className={ARTICLE[card.article]}>{card.article} </span>}{card.de}
            </div>
            <span className="absolute bottom-5 text-sm text-faint">Bosing yoki Space — javobni ko&apos;rish</span>
          </div>
          <div className="card absolute inset-0 flex flex-col items-center justify-center p-8 shadow-[var(--shadow-md)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="text-sm text-mute">{card.article ? `${card.article} ${card.de}` : card.de}{card.plural ? ` · pl. ${card.plural}` : ""}</div>
            <div className="mt-3 text-center font-display text-4xl leading-tight sm:text-5xl">{card.uz}</div>
            {card.example_de && <p className="mt-5 text-center italic text-mute">{card.example_de}</p>}
          </div>
        </div>
      </button>

      <div className="mt-3 flex justify-center gap-2">
        <button onClick={speak} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-mute hover:bg-sunken hover:text-ink"><Volume2 className="size-4" /> Talaffuz</button>
        <button onClick={() => setFlipped((f) => !f)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-mute hover:bg-sunken hover:text-ink"><RotateCcw className="size-4" /> Aylantirish</button>
      </div>

      <div className={cn("mt-6 grid grid-cols-4 gap-2 transition", !flipped && "pointer-events-none opacity-40")}>
        {GRADES.map((g) => (
          <button key={g.q} onClick={() => grade(g.q)} className={cn("rounded-xl border border-line bg-surface px-2 py-3 text-center transition", g.cls)}>
            <div className="text-sm font-medium">{g.label}</div>
            <div className="mt-0.5 text-xs text-faint">{nextLabel(card, g.q)} · {g.key}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
