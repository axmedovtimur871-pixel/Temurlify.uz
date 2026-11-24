"use client";

import { useState, useTransition } from "react";
import { ArrowLeftRight, Check, Copy, Loader2, Plus, Sparkles, Volume2 } from "lucide-react";
import { addCard } from "./actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Result = {
  translation: string; alternatives: string[]; notes: string;
  words: { source: string; target: string; info: string }[]; source: "ai" | "dictionary";
};

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function Translator() {
  const [direction, setDirection] = useState<"de-uz" | "uz-de">("de-uz");
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const [from, to] = direction === "de-uz" ? ["Deutsch", "O'zbekcha"] : ["O'zbekcha", "Deutsch"];

  const run = () => start(async () => {
    setError(null);
    const res = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, direction }) });
    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Xatolik"); return; }
    setResult(json);
  });

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="w-28 text-sm font-medium">{from}</span>
          <button
            onClick={() => { setDirection(direction === "de-uz" ? "uz-de" : "de-uz"); if (result?.translation) setText(result.translation); setResult(null); }}
            className="grid size-9 place-items-center rounded-full border border-line text-ink-2 transition hover:rotate-180 hover:bg-surface-2"
            aria-label="Yo'nalishni almashtirish"
          >
            <ArrowLeftRight className="size-4" />
          </button>
          <span className="w-28 text-right text-sm font-medium">{to}</span>
        </div>
        <div className="grid md:grid-cols-2 md:divide-x md:divide-line">
          <div className="p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && text.trim()) run(); }}
              maxLength={2000}
              placeholder={direction === "de-uz" ? "Ich lerne seit einem Jahr Deutsch…" : "Men bir yildan beri nemis tilini o'rganyapman…"}
              className="min-h-44 w-full resize-none bg-transparent font-display text-[1.45rem] leading-snug placeholder:text-faint focus:outline-none"
              lang={direction === "de-uz" ? "de" : "uz"}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-faint tabular">{text.length}/2000</span>
              <Button onClick={run} disabled={!text.trim() || pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Tarjima qilish
              </Button>
            </div>
          </div>
          <div className="min-h-44 border-t border-line bg-surface-2 p-4 md:border-t-0">
            {pending ? (
              <div className="space-y-3 pt-1"><div className="skeleton h-6 w-4/5" /><div className="skeleton h-6 w-3/5" /><div className="skeleton h-4 w-2/5" /></div>
            ) : result?.translation ? (
              <div className="animate-fade-up">
                <p className="font-display text-[1.45rem] leading-snug text-ink" lang={direction === "de-uz" ? "uz" : "de"}>{result.translation}</p>
                <div className="mt-3 flex gap-1">
                  {direction === "uz-de" && (
                    <button onClick={() => speak(result.translation)} className="grid size-8 place-items-center rounded-lg text-mute hover:bg-sunken hover:text-ink" aria-label="Tinglash"><Volume2 className="size-4" /></button>
                  )}
                  <button onClick={() => { navigator.clipboard.writeText(result.translation); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="grid size-8 place-items-center rounded-lg text-mute hover:bg-sunken hover:text-ink" aria-label="Nusxa olish">
                    {copied ? <Check className="size-4 text-brand" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <p className="pt-1 text-faint">{error ? <span className="text-danger">{error}</span> : "Tarjima shu yerda paydo bo'ladi"}</p>
            )}
          </div>
        </div>
      </div>

      {result && !pending && (
        <div className="grid gap-5 animate-fade-up md:grid-cols-[1fr_1.2fr]">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em] text-mute">
              Izoh {result.source === "ai" ? <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] text-brand">AI</span> : <span className="rounded bg-sunken px-1.5 py-0.5 text-[10px]">Lug&apos;at</span>}
            </div>
            <p className="mt-2 leading-relaxed text-ink-2">{result.notes}</p>
            {result.alternatives.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-mute">Muqobil variantlar</div>
                <ul className="mt-1.5 space-y-1">{result.alternatives.map((a) => <li key={a} className="text-sm">— {a}</li>)}</ul>
              </div>
            )}
          </div>
          {result.words.length > 0 && (
            <div className="card p-5">
              <div className="text-[13px] font-medium uppercase tracking-[0.12em] text-mute">Muhim so&apos;zlar</div>
              <ul className="mt-2 divide-y divide-line">
                {result.words.map((w, i) => (
                  <li key={i} className="grid grid-cols-[1fr_1fr] gap-3 py-2.5 text-sm">
                    <span className="font-medium">{w.source}</span>
                    <span><span className="text-ink-2">{w.target}</span>{w.info && <span className="block text-xs text-mute">{w.info}</span>}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AddWordButton({ vocabId, label, added }: { vocabId: string; label: string; added: boolean }) {
  const [done, setDone] = useState(added);
  const [pending, start] = useTransition();
  return (
    <button
      disabled={done || pending}
      onClick={() => start(async () => { const r = await addCard(vocabId); if (!r.error) setDone(true); })}
      className={cn("grid size-8 shrink-0 place-items-center rounded-lg border transition", done ? "border-transparent bg-brand-soft text-brand" : "border-line text-mute hover:border-brand hover:text-brand")}
      aria-label={done ? `${label} kartochkalarda` : `${label} — kartochkaga qo'shish`}
      title={done ? "Kartochkalarda" : "Kartochkaga qo'shish"}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : done ? <Check className="size-4" /> : <Plus className="size-4" />}
    </button>
  );
}
