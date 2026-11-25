import Link from "next/link";
import {
  ArrowRight, BookOpenCheck, Check, Gamepad2, Headphones, Languages, Layers, LineChart,
  Lock, Mic, PenLine, PlayCircle, Shuffle, Sparkles, BookText, Users, Bell,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LinkButton } from "@/components/ui/button";
import { LevelTag } from "@/components/ui/misc";
import type { Level } from "@/lib/types";

const CURRICULUM: { level: Level; name: string; lessons: string[] }[] = [
  { level: "A1", name: "Boshlang'ich", lessons: ["Hallo! Wie heißt du?", "Meine Familie", "Essen und Trinken", "Perfekt mit sein"] },
  { level: "A2", name: "Asosiy", lessons: ["Kindheit", "Am Telefon", "Wechselpräpositionen", "Bewerbung"] },
  { level: "B1", name: "O'rta", lessons: ["Lebensläufe", "Konjunktiv II", "Umweltschutz", "Formelle Briefe"] },
  { level: "B2", name: "O'rtadan yuqori", lessons: ["Arbeitswelt im Wandel", "Medienkompetenz", "Argumentieren", "Präsentieren"] },
  { level: "C1", name: "Ilg'or", lessons: ["Wissenschaftliches Schreiben", "Medien und Macht", "Rhetorik", "C1 Abschluss"] },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="Temurlify"><Logo /></Link>
          <nav className="hidden items-center gap-8 text-sm text-ink-2 md:flex">
            <a href="#dastur" className="hover:text-ink">Dastur</a>
            <a href="#imkoniyatlar" className="hover:text-ink">Imkoniyatlar</a>
            <a href="#oqituvchilar" className="hover:text-ink">O&apos;qituvchilar uchun</a>
          </nav>
          <div className="flex items-center gap-2">
            <LinkButton href="/login" variant="ghost" size="sm">Kirish</LinkButton>
            <LinkButton href="/register" size="sm">Boshlash</LinkButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.05fr_1fr] md:pt-20 lg:gap-16">
        <div className="animate-fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] text-ink-2">
            <span className="size-1.5 rounded-full bg-brand" /> Raqamli nemis tili sinfxonasi
          </div>
          <h1 className="font-display text-[2.9rem] leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[4.4rem]">
            Nemis tili —<br />
            <span className="italic text-brand">A1 dan C1</span> gacha,<br />
            bir tizimda.
          </h1>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-ink-2">
            120 ta video dars, har biridan keyin test, to&apos;rt ko&apos;nikma bo&apos;yicha uy vazifalari,
            nemischa-o&apos;zbekcha lug&apos;at va AI tarjimon. Har bir darsni kamida{" "}
            <strong className="font-semibold text-ink">53%</strong> bilan topshirsangiz, keyingisi ochiladi.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href="/register" size="lg">
              Bepul ro&apos;yxatdan o&apos;tish <ArrowRight className="size-4" />
            </LinkButton>
            <LinkButton href="/login" size="lg" variant="secondary">Hisobim bor</LinkButton>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
            {[["120", "dars"], ["840+", "so'z"], ["4", "ko'nikma"]].map(([n, l]) => (
              <div key={l}>
                <dt className="font-display text-3xl text-ink tabular">{n}</dt>
                <dd className="text-sm text-mute">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Product preview composed from real UI pieces */}
        <div className="relative animate-fade-up [animation-delay:120ms]" aria-label="Platforma ko'rinishi">
          <div className="card relative overflow-hidden p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-[0.14em] text-mute">Sizning yo&apos;lingiz</div>
                <div className="mt-1 font-display text-2xl">A1 · Boshlang&apos;ich</div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl tabular">7 / 24</div>
                <div className="text-xs text-mute">dars tugatildi</div>
              </div>
            </div>
            <ol className="mt-5 space-y-2">
              {[
                { n: 6, t: "Im Kursraum", s: "done", score: 86 },
                { n: 7, t: "Essen und Trinken", s: "done", score: 71 },
                { n: 8, t: "Einkaufen", s: "current" },
                { n: 9, t: "Uhrzeit und Tagesablauf", s: "locked" },
              ].map((l) => (
                <li
                  key={l.n}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                    l.s === "current" ? "border-brand/40 bg-brand-softer" : "border-line bg-surface"
                  }`}
                >
                  <span
                    className={`grid size-8 place-items-center rounded-lg font-mono text-[13px] font-semibold ${
                      l.s === "done" ? "bg-brand text-brand-ink" : l.s === "current" ? "bg-surface text-brand ring-1 ring-brand/40" : "bg-sunken text-faint"
                    }`}
                  >
                    {l.s === "done" ? <Check className="size-4" /> : l.s === "locked" ? <Lock className="size-3.5" /> : l.n}
                  </span>
                  <span className={`flex-1 text-sm ${l.s === "locked" ? "text-faint" : "text-ink"}`}>{l.t}</span>
                  {l.score && <span className="font-mono text-xs text-brand">{l.score}%</span>}
                  {l.s === "current" && <PlayCircle className="size-5 text-brand" />}
                </li>
              ))}
            </ol>
          </div>

          <div className="card absolute -bottom-8 -left-4 hidden w-56 rotate-[-3deg] p-4 shadow-[var(--shadow-lg)] sm:block">
            <div className="text-[11px] uppercase tracking-[0.14em] text-mute">Kartochka</div>
            <div className="mt-2 font-display text-[1.6rem] leading-tight"><span className="text-lvl-a2">der</span> Bahnhof</div>
            <div className="mt-1 text-sm text-mute">vokzal · die Bahnhöfe</div>
          </div>
          <div className="card absolute -bottom-6 -right-3 hidden rotate-[3deg] items-center gap-2.5 px-3.5 py-2.5 shadow-[var(--shadow-lg)] sm:flex">
            <span className="grid size-8 place-items-center rounded-full bg-saffron-soft text-saffron"><Sparkles className="size-4" /></span>
            <div>
              <div className="text-sm font-medium">Yangi dars ochildi</div>
              <div className="text-xs text-mute">8-dars · Einkaufen</div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section id="dastur" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-brand">O&apos;quv dasturi</div>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Besh daraja. 120 dars. Bitta aniq yo&apos;l.</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
              Har bir darajada 24 ta dars: video, yangi so&apos;zlar fayli, grammatika va dars testi.
              Dasturni o&apos;qituvchi admin paneldan to&apos;liq boshqaradi.
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {CURRICULUM.map((c, i) => (
              <div key={c.level} className="bg-surface p-5">
                <div className="flex items-center justify-between">
                  <LevelTag level={c.level} />
                  <span className="font-mono text-xs text-faint">{i * 24 + 1}–{(i + 1) * 24}</span>
                </div>
                <div className="mt-3 font-medium">{c.name}</div>
                <ul className="mt-4 space-y-2 text-sm text-mute">
                  {c.lessons.map((l) => <li key={l} className="truncate">{l}</li>)}
                  <li className="text-faint">+ yana 20 dars</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="imkoniyatlar" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-brand">Imkoniyatlar</div>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">O&apos;rganish uchun kerak bo&apos;lgan hamma narsa — bir joyda.</h2>
            <p className="mt-4 text-ink-2">Talaba nima qilish kerakligini har doim biladi: bugungi dars, takrorlanadigan so&apos;zlar va topshiriladigan vazifalar bosh sahifada.</p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {[
              { icon: BookOpenCheck, t: "Video dars va testlar", d: "Har bir darsda video, so'zlar ro'yxati va test. Test natijasi 53% dan yuqori bo'lsa, keyingi dars avtomatik ochiladi." },
              { icon: PenLine, t: "To'rt ko'nikma bo'yicha uy vazifalari", d: "Lesen, Hören, Sprechen va Schreiben. Audio javobni brauzerda yozib yuborish, o'qituvchidan baho va izoh olish." },
              { icon: Languages, t: "Lug'at va AI tarjimon", d: "Nemischa-o'zbekcha lug'at artikl va ko'plik shakllari bilan. Tarjimon esa grammatik izoh ham beradi." },
              { icon: Layers, t: "Kartochkalar va takrorlash", d: "Har bir so'z unutilay deganda qayta chiqadi — interval asosida takrorlash (SM-2)." },
              { icon: Gamepad2, t: "Jonli o'yinlar", d: "O'qituvchi o'yin boshlaydi, talabalar Game ID orqali qo'shiladi. Natijalar real vaqtda reytingda." },
              { icon: LineChart, t: "Tahlil va yutuqlar", d: "Kunlik faollik, guruh bilan solishtirish, ketma-ket kunlar seriyasi, davomat va yutuq nishonlari." },
            ].map((f) => (
              <div key={f.t} className="grid grid-cols-[auto_1fr] gap-5 py-6">
                <span className="grid size-11 place-items-center rounded-xl border border-line bg-surface text-brand">
                  <f.icon className="size-5" strokeWidth={1.8} />
                </span>
                <div>
                  <h3 className="text-[17px] font-medium">{f.t}</h3>
                  <p className="mt-1.5 leading-relaxed text-mute">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teachers */}
      <section id="oqituvchilar" className="bg-ink text-paper">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-saffron">O&apos;qituvchilar uchun</div>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">Butun platforma — kod yozmasdan boshqariladi.</h2>
            <p className="mt-4 max-w-md text-paper/70">
              Darslar, videolar, testlar, lug&apos;at, uy vazifalari, e&apos;lonlar, o&apos;yinlar va talabalar — barchasi admin panelda.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              [Users, "Talabalar va guruhlar"],
              [PlayCircle, "Video va fayl yuklash"],
              [BookText, "Test savollari muharriri"],
              [Mic, "Vazifalarni baholash"],
              [Bell, "E'lon va bildirishnomalar"],
              [Shuffle, "Sinf randomayzeri"],
              [Headphones, "Hören audiolari"],
              [Gamepad2, "O'yin boshqaruvi"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof Users;
              return (
                <li key={t as string} className="flex items-center gap-3 rounded-xl border border-paper/12 px-4 py-3.5 text-[15px]">
                  <I className="size-4.5 text-saffron" strokeWidth={1.8} /> {t as string}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Birinchi darsni bugun boshlang.</h2>
        <p className="mx-auto mt-4 max-w-md text-ink-2">Ro&apos;yxatdan o&apos;ting — A1 ning birinchi darsi darhol ochiladi.</p>
        <LinkButton href="/register" size="lg" className="mt-8">Hisob yaratish <ArrowRight className="size-4" /></LinkButton>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-mute sm:flex-row">
          <Logo className="scale-90" />
          <span>© {new Date().getFullYear()} Temurlify · temurlify.uz</span>
        </div>
      </footer>
    </div>
  );
}
