import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "./form";

export const metadata: Metadata = { title: "Ro'yxatdan o'tish" };

export default function RegisterPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-4xl tracking-tight">Hisob yaratish</h1>
      <p className="mt-2 text-mute">Bir daqiqa — va A1 ning birinchi darsi siz uchun ochiladi.</p>
      <RegisterForm />
      <p className="mt-8 text-center text-sm text-mute">
        Hisobingiz bormi? <Link href="/login" className="font-medium text-brand hover:underline">Kirish</Link>
      </p>
    </div>
  );
}
