"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, FileText, GripVertical, Loader2, Plus, Save, Trash2, Video, X } from "lucide-react";
import {
  deleteLesson, deleteQuestion, deleteVocab, importVocab, saveLesson, saveQuestion, saveVocab, setLessonFile,
  type QuestionInput,
} from "../actions";
import { Button, SubmitButton } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { FileUpload } from "@/components/file-upload";
import { LEVELS, type Lesson, type Question, type Vocab } from "@/lib/types";
import { cn, embedUrl } from "@/lib/utils";

// ---------------------------------------------------------------- details
export function DetailsForm({ lesson }: { lesson: Lesson }) {
  const [state, action] = useActionState(saveLesson.bind(null, lesson.id), null);
  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="card space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sarlavha (nemischa)" htmlFor="title"><Input id="title" name="title" defaultValue={lesson.title} required /></Field>
          <Field label="Sarlavha (o'zbekcha)" htmlFor="title_uz"><Input id="title_uz" name="title_uz" defaultValue={lesson.title_uz} required /></Field>
        </div>
        <Field label="Grammatika mavzusi" htmlFor="grammar"><Input id="grammar" name="grammar" defaultValue={lesson.grammar} /></Field>
        <Field label="Dars izohi" hint="Qo'llab-quvvatlanadi: ## sarlavha, **qalin**, _ajratilgan_, 1. ro'yxat, - ro'yxat" htmlFor="summary">
          <Textarea id="summary" name="summary" defaultValue={lesson.summary} className="min-h-80 font-mono text-[13.5px]" />
        </Field>
      </div>
      <div className="space-y-6">
        <div className="card space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Daraja" htmlFor="level"><Select id="level" name="level" defaultValue={lesson.level}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
            <Field label="Davomiyligi (daq)" htmlFor="duration_min"><Input id="duration_min" name="duration_min" type="number" min={1} defaultValue={lesson.duration_min} /></Field>
          </div>
          <Field label="O'tish bali (%)" hint="Bo'sh qoldirilsa — umumiy sozlama (53%)" htmlFor="pass_score">
            <Input id="pass_score" name="pass_score" type="number" min={1} max={100} defaultValue={lesson.pass_score ?? ""} />
          </Field>
          <Field label="Video havolasi" hint="YouTube yoki Vimeo. Fayl yuklash — «Video va fayl» bo'limida" htmlFor="video_url">
            <Input id="video_url" name="video_url" defaultValue={lesson.video_url ?? ""} placeholder="https://youtu.be/…" />
          </Field>
          <Checkbox name="is_published" defaultChecked={lesson.is_published} label="Talabalarga e'lon qilingan" />
        </div>
        <FormMessage state={state} />
        <SubmitButton className="w-full" size="lg"><Save className="size-4" /> Saqlash</SubmitButton>
      </div>
    </form>
  );
}

export function DeleteLesson({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="sm" className="text-danger" disabled={pending}
      onClick={() => confirm("Dars, uning savollari va talabalar natijalari o'chiriladi. Davom etasizmi?") && start(() => deleteLesson(id))}>
      <Trash2 className="size-4" /> O&apos;chirish
    </Button>
  );
}

// ---------------------------------------------------------------- media
export function MediaPanel({ lesson, videoSigned, fileSigned }: { lesson: Lesson; videoSigned: string | null; fileSigned: string | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const set = (field: "video_path" | "vocab_file_path", path: string | null) =>
    start(async () => { const r = await setLessonFile(lesson.id, field, path); setMsg(r.error ?? "Saqlandi"); });
  const embed = lesson.video_url ? embedUrl(lesson.video_url) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-medium"><Video className="size-4 text-mute" /> Video dars</h2>
        <p className="mt-1 text-sm text-mute">MP4 fayl yuklang (50 MB gacha) yoki «Ma&apos;lumot» bo&apos;limida YouTube/Vimeo havolasini kiriting. Yuklangan fayl havoladan ustun turadi.</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-ink">
          {videoSigned ? <video src={videoSigned} controls className="aspect-video w-full" /> :
            embed ? <iframe src={embed} className="aspect-video w-full" allowFullScreen title="Video" /> :
              <div className="grid aspect-video place-items-center text-sm text-paper/50">Video yo&apos;q</div>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FileUpload bucket="lesson-media" folder={`lessons/${lesson.id}`} accept="video/mp4,video/webm,video/quicktime" label="Video yuklash" onUploaded={(p) => set("video_path", p)} />
          {lesson.video_path && <Button variant="ghost" size="sm" className="text-danger" disabled={pending} onClick={() => set("video_path", null)}><X className="size-4" /> Faylni olib tashlash</Button>}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-medium"><FileText className="size-4 text-mute" /> So&apos;zlar fayli</h2>
        <p className="mt-1 text-sm text-mute">PDF, Word yoki Excel — talabalar dars sahifasidan yuklab oladi.</p>
        {lesson.vocab_file_path ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
            <FileText className="size-5 text-brand" />
            <a href={fileSigned ?? "#"} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm hover:underline">{lesson.vocab_file_path.split("/").pop()}</a>
            <button onClick={() => set("vocab_file_path", null)} className="grid size-8 place-items-center rounded-lg text-mute hover:bg-sunken hover:text-danger" aria-label="O'chirish"><Trash2 className="size-4" /></button>
          </div>
        ) : <p className="mt-4 rounded-xl border border-dashed border-line-strong p-4 text-center text-sm text-faint">Fayl yuklanmagan</p>}
        <div className="mt-4">
          <FileUpload bucket="lesson-media" folder={`lessons/${lesson.id}`} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv" label="Fayl yuklash" onUploaded={(p) => set("vocab_file_path", p)} />
        </div>
      </section>
      {msg && <p className="text-sm text-mute lg:col-span-2">{pending ? "Saqlanmoqda…" : msg}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- questions
type Draft = QuestionInput & { key: string; saved: boolean };

function toDraft(q: Question, key: Record<string, unknown> | undefined): Draft {
  return {
    key: q.id, id: q.id, lesson_id: q.lesson_id, kind: q.kind, prompt: q.prompt, options: q.options,
    explanation: q.explanation ?? "", position: q.position, answer: (key ?? {}) as Draft["answer"], saved: true,
  };
}

export function QuestionsEditor({ lessonId, initial, keys }: { lessonId: string; initial: Question[]; keys: Record<string, Record<string, unknown>> }) {
  const [items, setItems] = useState<Draft[]>(initial.map((q) => toDraft(q, keys[q.id])));
  const add = (kind: Draft["kind"]) => setItems((cur) => [...cur, {
    key: crypto.randomUUID(), lesson_id: lessonId, kind, prompt: "", options: kind === "text" ? [] : ["", "", ""],
    explanation: "", position: cur.length, answer: kind === "text" ? { accepted: [""] } : kind === "multi" ? { indexes: [] } : {}, saved: false,
  }]);

  return (
    <div className="space-y-4">
      {items.length === 0 && <p className="rounded-xl border border-dashed border-line-strong p-8 text-center text-sm text-mute">Hali savollar yo&apos;q. Savolsiz darsni talaba «tugatish» tugmasi bilan yakunlaydi.</p>}
      {items.map((q, i) => (
        <QuestionCard
          key={q.key}
          index={i}
          q={q}
          onChange={(next) => setItems((cur) => cur.map((x) => (x.key === q.key ? next : x)))}
          onRemove={() => setItems((cur) => cur.filter((x) => x.key !== q.key))}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => add("single")}><Plus className="size-4" /> Bitta javobli</Button>
        <Button variant="secondary" onClick={() => add("multi")}><Plus className="size-4" /> Ko&apos;p javobli</Button>
        <Button variant="secondary" onClick={() => add("text")}><Plus className="size-4" /> Yozma javob</Button>
      </div>
    </div>
  );
}

function QuestionCard({ q, index, onChange, onRemove }: { q: Draft; index: number; onChange: (q: Draft) => void; onRemove: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const patch = (p: Partial<Draft>) => onChange({ ...q, ...p, saved: false });

  const save = () => start(async () => {
    setErr(null);
    const res = await saveQuestion({ ...q, position: index });
    if (res.error) setErr(res.error);
    else onChange({ ...q, id: res.id, position: index, saved: true });
  });
  const remove = () => start(async () => {
    if (!confirm("Savol o'chirilsinmi?")) return;
    if (q.id) await deleteQuestion(q.id, q.lesson_id);
    onRemove();
  });

  return (
    <div className={cn("card p-5", !q.saved && "ring-2 ring-saffron/40")}>
      <div className="flex items-center gap-3">
        <GripVertical className="size-4 text-faint" />
        <span className="font-mono text-sm text-mute">{index + 1}</span>
        <Select value={q.kind} onChange={(e) => {
          const kind = e.target.value as Draft["kind"];
          patch({ kind, options: kind === "text" ? [] : q.options.length ? q.options : ["", "", ""], answer: kind === "text" ? { accepted: [""] } : kind === "multi" ? { indexes: [] } : {} });
        }} className="h-9 w-auto text-sm">
          <option value="single">Bitta javob</option><option value="multi">Bir nechta javob</option><option value="text">Yozma javob</option>
        </Select>
        <div className="flex-1" />
        {!q.saved && <span className="text-xs text-saffron">Saqlanmagan</span>}
        <button onClick={remove} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-sunken hover:text-danger" aria-label="O'chirish"><Trash2 className="size-4" /></button>
      </div>

      <Textarea value={q.prompt} onChange={(e) => patch({ prompt: e.target.value })} placeholder="Savol matni… (bo'sh joy uchun ___)" className="mt-4 min-h-16" />

      {q.kind === "text" ? (
        <Field label="Qabul qilinadigan javoblar" hint="Har bir qatorga bitta variant. Katta-kichik harf va oxirgi tinish belgisi hisobga olinmaydi." className="mt-4">
          <Textarea value={(q.answer.accepted ?? []).join("\n")} onChange={(e) => patch({ answer: { accepted: e.target.value.split("\n") } })} className="min-h-20" />
        </Field>
      ) : (
        <div className="mt-4 space-y-2">
          <div className="text-[13px] font-medium text-ink-2">Variantlar — to&apos;g&apos;risini belgilang</div>
          {q.options.map((opt, i) => {
            const correct = q.kind === "single" ? q.answer.index === i : (q.answer.indexes ?? []).includes(i);
            return (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => patch({ answer: q.kind === "single" ? { index: i } : { indexes: correct ? (q.answer.indexes ?? []).filter((x) => x !== i) : [...(q.answer.indexes ?? []), i] } })}
                  className={cn("grid size-9 shrink-0 place-items-center border transition", q.kind === "single" ? "rounded-full" : "rounded-lg", correct ? "border-brand bg-brand text-brand-ink" : "border-line-strong text-transparent hover:border-brand")}
                  aria-label="To'g'ri javob"
                ><Check className="size-4" /></button>
                <Input value={opt} onChange={(e) => patch({ options: q.options.map((o, k) => (k === i ? e.target.value : o)) })} placeholder={`${i + 1}-variant`} className="h-10" />
                <button
                  type="button"
                  onClick={() => {
                    const options = q.options.filter((_, k) => k !== i);
                    const shift = (x: number) => (x > i ? x - 1 : x);
                    patch({ options, answer: q.kind === "single" ? { index: q.answer.index === i ? undefined : q.answer.index !== undefined ? shift(q.answer.index) : undefined } : { indexes: (q.answer.indexes ?? []).filter((x) => x !== i).map(shift) } });
                  }}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-faint hover:bg-sunken hover:text-danger" aria-label="Variantni o'chirish"
                ><X className="size-4" /></button>
              </div>
            );
          })}
          {q.options.length < 6 && <button type="button" onClick={() => patch({ options: [...q.options, ""] })} className="text-sm text-brand hover:underline">+ Variant qo&apos;shish</button>}
        </div>
      )}

      <Input value={q.explanation} onChange={(e) => patch({ explanation: e.target.value })} placeholder="Izoh (javobdan keyin ko'rsatiladi, ixtiyoriy)" className="mt-4 h-10 text-sm" />

      <div className="mt-4 flex items-center justify-end gap-3">
        {err && <span className="text-sm text-danger">{err}</span>}
        <Button size="sm" onClick={save} disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Saqlash</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- vocabulary
export function VocabEditor({ lessonId, level, initial }: { lessonId: string | null; level: string; initial: Vocab[] }) {
  const [rows, setRows] = useState(initial);
  const [bulk, setBulk] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const blank: Vocab = { id: "", lesson_id: lessonId, level: level as Vocab["level"], de: "", article: null, plural: null, part_of_speech: "noun", uz: "", ru: null, example_de: null, example_uz: null };
  const [draft, setDraft] = useState<Vocab>(blank);

  const save = (v: Vocab) => start(async () => {
    const r = await saveVocab({ id: v.id || undefined, lesson_id: lessonId, level: v.level, de: v.de, article: v.article, plural: v.plural, uz: v.uz, example_de: v.example_de });
    if (r.error) { setMsg(r.error); return; }
    if (!v.id) { setRows((cur) => [...cur, { ...v, id: r.id! }]); setDraft(blank); }
    setMsg("Saqlandi");
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-[12px] uppercase tracking-wider text-mute">
            <tr><th className="w-24 px-3 py-2.5 font-medium">Artikl</th><th className="px-3 py-2.5 font-medium">Nemischa</th><th className="px-3 py-2.5 font-medium">Ko&apos;plik</th><th className="px-3 py-2.5 font-medium">O&apos;zbekcha</th><th className="w-20" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((v) => <VocabRow key={v.id} v={v} onSave={save} onDelete={() => start(async () => { await deleteVocab(v.id, lessonId); setRows((c) => c.filter((x) => x.id !== v.id)); })} />)}
            <VocabRow v={draft} onSave={save} isNew onDraft={setDraft} />
          </tbody>
        </table>
        {msg && <p className="px-3 py-2 text-xs text-mute">{pending ? "…" : msg}</p>}
      </div>
      <div className="card h-fit p-5">
        <h3 className="font-medium">Ommaviy qo&apos;shish</h3>
        <p className="mt-1 text-sm text-mute">Har bir qatorda: <code className="rounded bg-sunken px-1">der Tisch, Tische; stol</code></p>
        <Textarea value={bulk} onChange={(e) => setBulk(e.target.value)} className="mt-3 min-h-40 font-mono text-[13px]" placeholder={"der Tisch, Tische; stol\nlernen; o'rganmoq"} />
        <Button className="mt-3 w-full" variant="secondary" disabled={!bulk.trim() || pending} onClick={() => start(async () => {
          const r = await importVocab(lessonId, level, bulk);
          setMsg(r.error ?? `${r.count} ta so'z qo'shildi — sahifani yangilang`);
          if (!r.error) setBulk("");
        })}>Import qilish</Button>
      </div>
    </div>
  );
}

function VocabRow({ v, onSave, onDelete, isNew, onDraft }: { v: Vocab; onSave: (v: Vocab) => void; onDelete?: () => void; isNew?: boolean; onDraft?: (v: Vocab) => void }) {
  const [row, setRow] = useState(v);
  const [dirty, setDirty] = useState(false);
  const cur = isNew ? v : row;
  const set = (p: Partial<Vocab>) => { if (isNew) onDraft?.({ ...v, ...p }); else { setRow({ ...row, ...p }); setDirty(true); } };
  const cell = "h-9 w-full rounded-md border border-transparent bg-transparent px-2 hover:border-line focus:border-brand focus:bg-surface focus:outline-none";
  return (
    <tr className={isNew ? "bg-surface-2/60" : ""}>
      <td className="px-1 py-1">
        <select value={cur.article ?? ""} onChange={(e) => set({ article: (e.target.value || null) as Vocab["article"] })} className={cell}>
          <option value="">—</option><option>der</option><option>die</option><option>das</option>
        </select>
      </td>
      <td className="px-1 py-1"><input value={cur.de} onChange={(e) => set({ de: e.target.value })} placeholder={isNew ? "Yangi so'z…" : ""} className={cell} /></td>
      <td className="px-1 py-1"><input value={cur.plural ?? ""} onChange={(e) => set({ plural: e.target.value })} className={cell} /></td>
      <td className="px-1 py-1"><input value={cur.uz} onChange={(e) => set({ uz: e.target.value })} className={cell} /></td>
      <td className="px-1 py-1 text-right">
        {isNew ? (
          <button onClick={() => onSave(cur)} disabled={!cur.de || !cur.uz} className="grid size-8 place-items-center rounded-lg text-brand hover:bg-brand-soft disabled:text-faint" aria-label="Qo'shish"><Plus className="size-4" /></button>
        ) : (
          <div className="flex justify-end">
            {dirty && <button onClick={() => { onSave(row); setDirty(false); }} className="grid size-8 place-items-center rounded-lg text-brand hover:bg-brand-soft" aria-label="Saqlash"><Save className="size-4" /></button>}
            <button onClick={onDelete} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-sunken hover:text-danger" aria-label="O'chirish"><Trash2 className="size-4" /></button>
          </div>
        )}
      </td>
    </tr>
  );
}
