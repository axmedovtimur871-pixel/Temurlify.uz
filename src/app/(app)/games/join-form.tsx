"use client";

import { useActionState } from "react";
import { joinGame } from "./actions";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/button";

export function JoinForm({ defaultNick }: { defaultNick: string }) {
  const [state, action] = useActionState(joinGame, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <Field label="Game ID" htmlFor="code">
        <Input id="code" name="code" inputMode="numeric" pattern="[0-9 ]*" maxLength={7} required autoFocus placeholder="000 000" className="h-16 text-center font-mono text-3xl tracking-[0.3em]" />
      </Field>
      <Field label="Taxallus" htmlFor="nickname">
        <Input id="nickname" name="nickname" maxLength={24} defaultValue={defaultNick} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Ulanmoqda…">Qo&apos;shilish</SubmitButton>
    </form>
  );
}
