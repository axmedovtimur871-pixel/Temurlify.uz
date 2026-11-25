"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "../actions";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/button";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="siz@misol.uz" />
      </Field>
      <Field
        label={<span className="flex justify-between">Parol <Link href="/forgot-password" className="font-normal text-brand hover:underline">Unutdingizmi?</Link></span>}
        htmlFor="password"
      >
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Kirilmoqda…">Kirish</SubmitButton>
    </form>
  );
}
