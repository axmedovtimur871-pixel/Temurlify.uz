"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword } from "../actions";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(forgotPassword, null);
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-4xl tracking-tight">Parolni tiklash</h1>
      <p className="mt-2 text-mute">Emailingizni kiriting — tiklash havolasini yuboramiz.</p>
      <form action={action} className="mt-8 space-y-4">
        <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" required /></Field>
        <FormMessage state={state} />
        <SubmitButton size="lg" className="w-full">Havola yuborish</SubmitButton>
      </form>
      <p className="mt-8 text-center text-sm"><Link href="/login" className="text-brand hover:underline">Kirish sahifasiga qaytish</Link></p>
    </div>
  );
}
