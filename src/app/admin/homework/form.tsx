"use client";

import { useActionState, useState } from "react";
import { FileAudio, Trash2 } from "lucide-react";
import { saveHomework } from "./actions";
import { SubmitButton } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { FileUpload } from "@/components/file-upload";
import { LEVELS, type Homework, type Skill } from "@/lib/types";
import { SKILL_META } from "@/lib/utils";

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5 * 3600_000);
  return d.toISOString().slice(0, 16);
};

export function HomeworkForm({ homework, groups, lessons }: { homework?: Homework; groups: { id: string; name: string }[]; lessons: { id: string; position: number; title: string }[] }) {
  const [state, action] = useActionState(saveHomework.bind(null, homework?.id ?? null), null);
  const [skill, setSkill] = useState<Skill>(homework?.skill ?? "schreiben");
  const [attachment, setAttachment] = useState(homework?.attachment_path ?? "");

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="card space-y-4 p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(SKILL_META) as Skill[]).map((s) => (
            <label key={s} className={`cursor-pointer rounded-xl border p-3 text-center transition ${skill === s ? "border-brand bg-brand-softer" : "border-line hover:bg-surface-2"}`}>
              <input type="radio" name="skill" value={s} checked={skill === s} onChange={() => setSkill(s)} className="sr-only" />
              <div className="font-medium">{SKILL_META[s].de}</div>
              <div className="text-xs text-mute">{SKILL_META[s].uz}</div>
            </label>
          ))}
        </div>
        <Field label="Sarlavha" htmlFor="title"><Input id="title" name="title" defaultValue={homework?.title} required /></Field>
        <Field label="Topshiriq" hint="Talaba nima qilishi kerakligini aniq yozing" htmlFor="instructions"><Textarea id="instructions" name="instructions" defaultValue={homework?.instructions} /></Field>
        {skill === "lesen" && (
          <Field label="O'qish matni" htmlFor="reading_text"><Textarea id="reading_text" name="reading_text" defaultValue={homework?.reading_text ?? ""} className="min-h-56" lang="de" /></Field>
        )}
        {skill !== "lesen" && <input type="hidden" name="reading_text" value={homework?.reading_text ?? ""} />}
        <div>
          <div className="mb-1.5 text-[13px] font-medium text-ink-2">{skill === "hoeren" ? "Audio fayl (majburiy emas, lekin tavsiya etiladi)" : "Biriktirilgan fayl"}</div>
          <input type="hidden" name="attachment_path" value={attachment} />
          {attachment ? (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 text-sm">
              <FileAudio className="size-4 text-brand" /><span className="min-w-0 flex-1 truncate">{attachment.split("/").pop()}</span>
              <button type="button" onClick={() => setAttachment("")} className="text-mute hover:text-danger" aria-label="O'chirish"><Trash2 className="size-4" /></button>
            </div>
          ) : (
            <FileUpload bucket="homework" folder="assignments" accept={skill === "hoeren" ? "audio/*" : undefined} label={skill === "hoeren" ? "Audio yuklash" : "Fayl yuklash"} onUploaded={(p) => setAttachment(p)} />
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="card space-y-4 p-5">
          <Field label="Kimlar uchun" htmlFor="group_id">
            <Select id="group_id" name="group_id" defaultValue={homework?.group_id ?? ""}><option value="">Barcha talabalar</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Daraja" htmlFor="level"><Select id="level" name="level" defaultValue={homework?.level ?? "A1"}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
            <Field label="Maks. ball" htmlFor="max_points"><Input id="max_points" name="max_points" type="number" min={1} defaultValue={homework?.max_points ?? 100} /></Field>
          </div>
          <Field label="Bog'liq dars" htmlFor="lesson_id">
            <Select id="lesson_id" name="lesson_id" defaultValue={homework?.lesson_id ?? ""}><option value="">—</option>{lessons.map((l) => <option key={l.id} value={l.id}>{l.position}. {l.title}</option>)}</Select>
          </Field>
          <Field label="Muddat (Toshkent vaqti)" htmlFor="due_at"><Input id="due_at" name="due_at" type="datetime-local" defaultValue={toLocal(homework?.due_at ?? null)} /></Field>
          {skill === "schreiben" && <Field label="Minimal so'zlar soni" htmlFor="min_words"><Input id="min_words" name="min_words" type="number" min={0} defaultValue={homework?.min_words ?? ""} /></Field>}
          <Checkbox name="is_published" defaultChecked={homework?.is_published ?? true} label="E'lon qilish (talabalarga bildirishnoma boradi)" />
        </div>
        <FormMessage state={state} />
        <SubmitButton size="lg" className="w-full">{homework ? "Saqlash" : "Yaratish"}</SubmitButton>
      </div>
    </form>
  );
}
