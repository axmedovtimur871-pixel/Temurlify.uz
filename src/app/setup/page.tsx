import { Logo } from "@/components/ui/logo";
import { isConfigured } from "@/lib/env";
import { LinkButton } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <Logo />
      <h1 className="mt-10 font-display text-4xl">Sozlash</h1>
      {isConfigured ? (
        <div className="mt-6 space-y-4">
          <p className="text-ink-2">Platforma ulangan va ishlashga tayyor.</p>
          <LinkButton href="/login">Kirish</LinkButton>
        </div>
      ) : (
        <div className="mt-6 space-y-4 text-ink-2">
          <p>Platforma hali Supabase bilan ulanmagan. Vercel loyihasida quyidagi muhit o&apos;zgaruvchilarini kiriting va qayta deploy qiling:</p>
          <pre className="card overflow-x-auto p-4 font-mono text-sm leading-7">{`NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   (faqat serverda)
ANTHROPIC_API_KEY           (AI tarjimon, ixtiyoriy)
ADMIN_EMAILS                (admin bo'ladigan emaillar)`}</pre>
          <p className="text-sm text-mute">Batafsil yo&apos;riqnoma: repozitoriydagi README.md.</p>
        </div>
      )}
    </main>
  );
}
