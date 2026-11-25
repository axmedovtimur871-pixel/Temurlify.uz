import { LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
      <Logo />
      <p className="mt-12 font-mono text-sm text-mute">404</p>
      <h1 className="mt-2 font-display text-5xl">Seite nicht gefunden</h1>
      <p className="mt-3 text-mute">Sahifa topilmadi — u o&apos;chirilgan yoki manzil noto&apos;g&apos;ri.</p>
      <LinkButton href="/dashboard" className="mt-8">Bosh sahifaga</LinkButton>
    </main>
  );
}
