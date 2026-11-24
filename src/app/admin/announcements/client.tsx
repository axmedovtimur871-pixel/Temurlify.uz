"use client";

import { useActionState, useTransition } from "react";
import { Pin, PinOff, Send, Trash2 } from "lucide-react";
import { createAnnouncement, deleteAnnouncement, togglePin } from "./actions";
import { SubmitButton } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";

export function AnnouncementForm({ groups }: { groups: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createAnnouncement, null);
  return (
    <form action={action} className="space-y-4" key={state?.ok ?? "form"}>
      <Field label="Sarlavha" htmlFor="title"><Input id="title" name="title" required /></Field>
      <Field label="Matn" htmlFor="body"><Textarea id="body" name="body" /></Field>
      <Field label="Auditoriya" htmlFor="group_id">
        <Select id="group_id" name="group_id"><option value="">Barcha talabalar</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select>
      </Field>
      <Checkbox name="pinned" label="Mahkamlash (bosh sahifada yuqorida turadi)" />
      <FormMessage state={state} />
      <SubmitButton className="w-full"><Send className="size-4" /> Yuborish</SubmitButton>
    </form>
  );
}

export function AnnouncementActions({ id, pinned }: { id: string; pinned: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex shrink-0">
      <button disabled={pending} onClick={() => start(() => togglePin(id, !pinned))} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-sunken hover:text-ink" aria-label={pinned ? "Mahkamni olish" : "Mahkamlash"}>
        {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
      </button>
      <button disabled={pending} onClick={() => confirm("E'lon o'chirilsinmi?") && start(() => deleteAnnouncement(id))} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-sunken hover:text-danger" aria-label="O'chirish"><Trash2 className="size-4" /></button>
    </div>
  );
}
