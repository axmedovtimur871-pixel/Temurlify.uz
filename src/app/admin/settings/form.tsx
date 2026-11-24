"use client";

import { useActionState } from "react";
import { saveSettings } from "./actions";
import { SubmitButton } from "@/components/ui/button";
import { Checkbox, Field, FormMessage, Input } from "@/components/ui/field";

type Values = { pass_score: number; daily_xp_goal: number; allow_signup: boolean; translator_enabled: boolean; platform_name: string };

export function SettingsForm({ values }: { values: Values }) {
  const [state, action] = useActionState(saveSettings, null);
  return (
    <form action={action} className="card space-y-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Testdan o'tish bali (%)" hint="Keyingi dars ochilishi uchun minimal natija. Darsda alohida belgilanmagan bo'lsa ishlatiladi." htmlFor="pass_score">
          <Input id="pass_score" name="pass_score" type="number" min={1} max={100} defaultValue={values.pass_score} required />
        </Field>
        <Field label="Kunlik XP maqsadi" htmlFor="daily_xp_goal"><Input id="daily_xp_goal" name="daily_xp_goal" type="number" min={10} max={1000} defaultValue={values.daily_xp_goal} required /></Field>
      </div>
      <Field label="Platforma nomi" htmlFor="platform_name"><Input id="platform_name" name="platform_name" defaultValue={values.platform_name} /></Field>
      <div className="space-y-3">
        <Checkbox name="allow_signup" defaultChecked={values.allow_signup} label="Yangi talabalar o'zlari ro'yxatdan o'ta oladi" />
        <Checkbox name="translator_enabled" defaultChecked={values.translator_enabled} label="AI tarjimon yoqilgan" />
      </div>
      <FormMessage state={state} />
      <SubmitButton>Saqlash</SubmitButton>
    </form>
  );
}
