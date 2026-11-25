import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="w-fit"><Logo /></Link>
        <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">{children}</main>
        <p className="text-center text-xs text-faint">© Temurlify · temurlify.uz</p>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-line bg-ink text-paper lg:block">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(var(--paper) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="text-[12px] uppercase tracking-[0.18em] text-paper/50">Wort des Tages · Kun so&apos;zi</div>
          <div>
            <div className="font-display text-[5.5rem] leading-[0.95]">
              <span className="text-saffron">die</span><br />Neugier
            </div>
            <div className="mt-5 text-xl text-paper/80">qiziquvchanlik</div>
            <p className="mt-8 max-w-sm font-display text-2xl italic leading-snug text-paper/70">
              „Neugier ist der Anfang allen Lernens.&ldquo;
            </p>
            <p className="mt-2 text-sm text-paper/50">Qiziquvchanlik — har qanday o&apos;rganishning boshlanishi.</p>
          </div>
          <div className="flex gap-2">
            {["A1", "A2", "B1", "B2", "C1"].map((l, i) => (
              <div key={l} className="flex-1">
                <div className={`h-1 rounded-full ${i === 0 ? "bg-saffron" : "bg-paper/15"}`} />
                <div className="mt-2 font-mono text-xs text-paper/50">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
