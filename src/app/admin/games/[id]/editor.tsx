"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { deleteGameQuestion, deleteSet, generateFromLessons, saveGameQuestion, updateSet } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { SLOTS } from "@/components/game/parts";
import { cn } from "@/lib/utils";

type Q = { id?: string; key: string; prompt: string; options: string[]; correct: number; saved: boolean };

export function SetEditor({ set, initial }: { set: { id: string; title: string; level: string; seconds_per_question: number }; initial: Omit<Q, "key" | "saved">[] }) {
  const [items, setItems] = useState<Q[]>(initial.map((q) => ({ ...q, key: q.id!, saved: true })));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [n, setN] = useState(10);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        {items.map((q, i) => (
          <GameQuestion key={q.key} q={q} index={i} setId={set.id}
            onChange={(next) => setItems((c) => c.map((x) => (x.key === q.key ? next : x)))}
            onRemove={() => setItems((c) => c.filter((x) => x.key !== q.key))} />
        ))}
        <Button variant="secondary" onClick={() => setItems((c) => [...c, { key: crypto.randomUUID(), prompt: "", options: ["", "", "", ""], correct: 0, saved: false }])}>
          <Plus className="size-4" /> Savol qo&apos;shish
        </Button>
      </div>
      <aside className="space-y-4">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-medium"><Sparkles className="size-4 text-saffron" /> Lug&apos;atdan yaratish</h3>
          <p className="mt-1 text-sm text-mute">{set.level} darajasidagi so&apos;zlardan tasodifiy savollar.</p>
          <div className="mt-3 flex gap-2">
            <Input type="number" min={1} max={30} value={n} onChange={(e) => setN(Number(e.target.value))} className="h-10 w-20" />
            <Button className="flex-1" disabled={pending} onClick={() => start(async () => { const r = await generateFromLessons(set.id, set.level, n); setMsg(r.error ?? `${r.count} ta savol qo'shildi`); if (!r.error) location.reload(); })}>
              {pending && <Loader2 className="size-4 animate-spin" />} Yaratish
            </Button>
          </div>
          {msg && <p className="mt-2 text-sm text-mute">{msg}</p>}
        </div>
        <div className="card space-y-3 p-5">
          <label className="block text-[13px] font-medium text-ink-2">Har savolga vaqt (soniya)</label>
          <Input type="number" min={5} max={120} defaultValue={set.seconds_per_question} onBlur={(e) => updateSet(set.id, { seconds_per_question: Number(e.target.value) })} className="h-10" />
          <Button variant="ghost" className="w-full text-danger" onClick={() => confirm("To'plam o'chirilsinmi?") && start(() => deleteSet(set.id))}><Trash2 className="size-4" /> To&apos;plamni o&apos;chirish</Button>
        </div>
      </aside>
    </div>
  );
}

function GameQuestion({ q, index, setId, onChange, onRemove }: { q: Q; index: number; setId: string; onChange: (q: Q) => void; onRemove: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const patch = (p: Partial<Q>) => onChange({ ...q, ...p, saved: false });
  return (
    <div className={cn("card p-4", !q.saved && "ring-2 ring-saffron/40")}>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-mute">{index + 1}</span>
        <Input value={q.prompt} onChange={(e) => patch({ prompt: e.target.value })} placeholder="Savol" className="h-10" />
        <button onClick={() => start(async () => { if (q.id) await deleteGameQuestion(q.id, setId); onRemove(); })} className="grid size-9 shrink-0 place-items-center rounded-lg text-faint hover:bg-sunken hover:text-danger" aria-label="O'chirish"><Trash2 className="size-4" /></button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {q.options.map((o, i) => {
          const S = SLOTS[i];
          return (
            <div key={i} className={cn("flex items-center gap-2 rounded-xl border p-1.5", q.correct === i ? "border-brand bg-brand-softer" : "border-line")}>
              <button onClick={() => patch({ correct: i })} className={cn("grid size-8 shrink-0 place-items-center rounded-lg", S.cls)} aria-label="To'g'ri javob" title="To'g'ri javob sifatida belgilash"><S.icon className="size-4 fill-current" /></button>
              <input value={o} onChange={(e) => patch({ options: q.options.map((x, k) => (k === i ? e.target.value : x)) })} placeholder={`Variant ${i + 1}${i > 1 ? " (ixtiyoriy)" : ""}`} className="h-8 min-w-0 flex-1 bg-transparent text-sm focus:outline-none" />
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-3">
        {err && <span className="text-sm text-danger">{err}</span>}
        <span className="mr-auto text-xs text-mute">To&apos;g&apos;ri javob: belgini bosing</span>
        <Button size="sm" disabled={pending} onClick={() => start(async () => {
          const r = await saveGameQuestion({ id: q.id, set_id: setId, prompt: q.prompt, options: q.options, correct: q.correct, position: index });
          if (r.error) setErr(r.error); else { setErr(null); onChange({ ...q, id: r.id, saved: true, options: q.options.filter((x) => x.trim()) }); }
        })}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Saqlash</Button>
      </div>
    </div>
  );
}
