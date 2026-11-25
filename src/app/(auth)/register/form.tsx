"use client";

import { useActionState } from "react";
import { register } from "../actions";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/button";

export function RegisterForm() {
  const [state, action] = useActionState(register, null);
  if (state?.ok) return <div className="mt-8"><FormMessage state={state} /></div>;
  return (
    <form action={action} className="mt-8 space-y-4">
      <Field label="Ism va familiya" htmlFor="full_name">
        <Input id="full_name" name="full_name" autoComplete="name" required placeholder="Aziza Karimova" />
      </Field>
      <Field label="Telefon" hint="Ixtiyoriy — o'qituvchi siz bilan bog'lanishi uchun" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+998 90 123 45 67" />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="siz@misol.uz" />
      </Field>
      <Field label="Parol" hint="Kamida 8 ta belgi" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Yaratilmoqda…">Ro&apos;yxatdan o&apos;tish</SubmitButton>
    </form>
  );
}
