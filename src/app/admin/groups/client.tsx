"use client";

import { useActionState, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteGroup, saveGroup } from "../actions";
import { SubmitButton } from "@/components/ui/button";
import { Field, FormMessage, Input, Select } from "@/components/ui/field";
import { Modal } from "../students/client";
import { LEVELS } from "@/lib/types";

type G = { id: string; name: string; level: string; schedule: string | null };

function Fields({ group }: { group?: G }) {
  return (
    <>
      {group && <input type="hidden" name="id" value={group.id} />}
      <Field label="Nomi" htmlFor="gname"><Input id="gname" name="name" defaultValue={group?.name} placeholder="A1-ertalabki" required /></Field>
      <Field label="Daraja" htmlFor="glevel"><Select id="glevel" name="level" defaultValue={group?.level ?? "A1"}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
      <Field label="Jadval" hint="Masalan: Du/Chor/Ju 9:00" htmlFor="gsched"><Input id="gsched" name="schedule" defaultValue={group?.schedule ?? ""} /></Field>
    </>
  );
}

export function GroupForm({ group, compact }: { group?: G; compact?: boolean }) {
  const [state, action] = useActionState(saveGroup, null);
  const [open, setOpen] = useState(false);
  if (compact) {
    return (
      <>
        <button onClick={() => setOpen(true)} className="text-mute hover:text-ink">Tahrirlash</button>
        <Modal open={open} onClose={() => setOpen(false)} title="Guruhni tahrirlash">
          <form action={action} className="space-y-4"><Fields group={group} /><FormMessage state={state} /><SubmitButton className="w-full">Saqlash</SubmitButton></form>
        </Modal>
      </>
    );
  }
  return <form action={action} className="space-y-4"><Fields /><FormMessage state={state} /><SubmitButton className="w-full">Yaratish</SubmitButton></form>;
}

export function DeleteGroup({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} onClick={() => confirm("Guruh o'chirilsinmi? Talabalar guruhsiz qoladi.") && start(() => deleteGroup(id))} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-sunken hover:text-danger" aria-label="O'chirish">
      <Trash2 className="size-4" />
    </button>
  );
}
