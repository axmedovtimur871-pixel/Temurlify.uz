import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { hasServiceRole } from "@/lib/supabase/admin";
import { hasAI } from "@/lib/ai/translate";
import { PageHeader } from "@/components/ui/misc";
import { SettingsForm } from "./form";

export const metadata: Metadata = { title: "Sozlamalar" };

export default async function AdminSettings() {
  await requireAdmin();
  const supabase = await supabaseServer();
  const { data } = await supabase.from("app_settings").select("key, value");
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  const checks = [
    ["Supabase ulanishi", true],
    ["Service role kaliti (talaba yaratish)", hasServiceRole()],
    ["AI tarjimon (ANTHROPIC_API_KEY)", hasAI()],
  ] as const;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Platforma sozlamalari" description="Bu sozlamalar darhol barcha foydalanuvchilarga ta'sir qiladi." />
      <SettingsForm values={{
        pass_score: Number(s.pass_score ?? 53), daily_xp_goal: Number(s.daily_xp_goal ?? 50),
        allow_signup: s.allow_signup !== false, translator_enabled: s.translator_enabled !== false, platform_name: String(s.platform_name ?? "Temurlify"),
      }} />
      <section className="card mt-6 p-5">
        <h2 className="font-medium">Tizim holati</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {checks.map(([l, ok]) => (
            <li key={l} className="flex items-center justify-between py-2.5">
              <span>{l}</span>
              <span className={ok ? "text-brand" : "text-mute"}>{ok ? "Ulangan" : "Sozlanmagan"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-mute">Maxfiy kalitlar faqat Vercel muhit o&apos;zgaruvchilarida saqlanadi va brauzerga hech qachon yuborilmaydi.</p>
      </section>
    </div>
  );
}
