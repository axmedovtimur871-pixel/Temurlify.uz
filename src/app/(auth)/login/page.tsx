import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/dashboard";
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-4xl tracking-tight">Xush kelibsiz</h1>
      <p className="mt-2 text-mute">Hisobingizga kiring va o&apos;qishni davom ettiring.</p>
      {sp.blocked && <p className="mt-6 rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-sm text-danger">Hisobingiz vaqtincha faol emas. O&apos;qituvchingizga murojaat qiling.</p>}
      <LoginForm next={next} />
      <p className="mt-8 text-center text-sm text-mute">
        Hisobingiz yo&apos;qmi? <Link href="/register" className="font-medium text-brand hover:underline">Ro&apos;yxatdan o&apos;ting</Link>
      </p>
    </div>
  );
}
