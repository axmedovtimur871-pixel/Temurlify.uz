"use client";

import { useActionState, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { createLesson, moveLesson } from "./actions";
import { Button, SubmitButton } from "@/components/ui/button";
import { Field, FormMessage, Input, Select } from "@/components/ui/field";
import { Modal } from "../students/client";
import { LEVELS } from "@/lib/types";

export function NewLesson({ defaultLevel }: { defaultLevel: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createLesson, null);
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="size-4" /> Yangi dars</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Yangi dars">
        <form action={action} className="space-y-4">
          <Field label="Sarlavha (nemischa)" htmlFor="t"><Input id="t" name="title" required /></Field>
          <Field label="Sarlavha (o'zbekcha)" htmlFor="tu"><Input id="tu" name="title_uz" /></Field>
          <Field label="Daraja" htmlFor="lv"><Select id="lv" name="level" defaultValue={defaultLevel}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
          <p className="text-xs text-mute">Dars dastur oxiriga qoralama sifatida qo&apos;shiladi — keyin tartibini o&apos;zgartirib, e&apos;lon qilasiz.</p>
          <FormMessage state={state} />
          <SubmitButton className="w-full">Yaratish</SubmitButton>
        </form>
      </Modal>
    </>
  );
}

export function MoveButtons({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col">
      <button disabled={pending} onClick={() => start(() => moveLesson(id, -1))} className="text-faint hover:text-ink" aria-label="Yuqoriga"><ChevronUp className="size-4" /></button>
      <button disabled={pending} onClick={() => start(() => moveLesson(id, 1))} className="text-faint hover:text-ink" aria-label="Pastga"><ChevronDown className="size-4" /></button>
    </div>
  );
}
