"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Play, Plus } from "lucide-react";
import { createSet, startGame } from "./actions";
import { Button, SubmitButton } from "@/components/ui/button";
import { Field, FormMessage, Input, Select } from "@/components/ui/field";
import { Modal } from "../students/client";
import { LEVELS } from "@/lib/types";

export function NewSet() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createSet, null);
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus className="size-4" /> Yangi to&apos;plam</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Savollar to'plami">
        <form action={action} className="space-y-4">
          <Field label="Nomi" htmlFor="title"><Input id="title" name="title" required placeholder="A1: Oila va kasblar" /></Field>
          <Field label="Tavsif" htmlFor="description"><Input id="description" name="description" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Daraja" htmlFor="level"><Select id="level" name="level">{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select></Field>
            <Field label="Har savolga (s)" htmlFor="seconds"><Input id="seconds" name="seconds" type="number" min={5} max={120} defaultValue={20} /></Field>
          </div>
          <FormMessage state={state} />
          <SubmitButton className="w-full">Yaratish</SubmitButton>
        </form>
      </Modal>
    </>
  );
}

export function StartButton({ setId, disabled }: { setId: string; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="text-right">
      <Button size="sm" disabled={disabled || pending} onClick={() => start(async () => { const r = await startGame(setId); if (r?.error) setErr(r.error); })}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />} Boshlash
      </Button>
      {err && <p className="mt-1 text-xs text-danger">{err}</p>}
    </div>
  );
}
