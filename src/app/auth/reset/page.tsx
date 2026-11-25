"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/(auth)/actions";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function ResetPage() {
  const [state, action] = useActionState(updatePassword, null);
  return (
    <main className="mx-auto flex min-h-screen max-w-[400px] flex-col justify-center px-5">
      <Logo />
      <h1 className="mt-10 font-display text-4xl tracking-tight">Yangi parol</h1>
      <form action={action} className="mt-8 space-y-4">
        <Field label="Yangi parol" htmlFor="password"><Input id="password" name="password" type="password" minLength={8} required /></Field>
        <Field label="Parolni takrorlang" htmlFor="confirm"><Input id="confirm" name="confirm" type="password" minLength={8} required /></Field>
        <FormMessage state={state} />
        <SubmitButton size="lg" className="w-full">Saqlash</SubmitButton>
      </form>
    </main>
  );
}
