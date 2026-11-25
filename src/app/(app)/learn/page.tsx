import Link from "next/link";
import type { Metadata } from "next";
import { Check, Lock, PlayCircle, Video } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { LevelTag, PageHeader, Progress } from "@/components/ui/misc";
import { LEVELS, type CurriculumRow } from "@/lib/types";
import { LEVEL_META, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Darslar" };

export default async function LearnPage({ searchParams }: PageProps<"/learn">) {
  const sp = await searchParams;
  const supabase = await supabaseServer();
  const [{ data }, { data: passSetting }] = await Promise.all([
    supabase.rpc("my_curriculum"),
    supabase.from("app_settings").select("value").eq("key", "pass_score").maybeSingle(),
  ]);
  const lessons = (data ?? []) as CurriculumRow[];
  const current = lessons.find((l) => l.unlocked && !l.passed);
  const activeLevel = (typeof sp.level === "string" && LEVELS.includes(sp.level as never) ? sp.level : current?.level ?? "A1") as CurriculumRow["level"];
  const visible = lessons.filter((l) => l.level === activeLevel);
  const passScore = Number(passSetting?.value ?? 53);

  return (
    <div>
      <PageHeader
        eyebrow="O'quv dasturi"
        title="A1 dan C1 gacha"
        description={`Har bir darsni video bilan o'rganing va testni kamida ${passScore}% bilan topshiring — keyingi dars avtomatik ochiladi.`}
      />

      <div className="-mx-4 mb-6 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2">
          {LEVELS.map((lvl) => {
            const items = lessons.filter((l) => l.level === lvl);
            const done = items.filter((l) => l.passed).length;
            const active = lvl === activeLevel;
            return (
              <Link
                key={lvl}
                href={`/learn?level=${lvl}`}
                className={cn(
                  "w-40 rounded-xl border px-4 py-3 transition",
                  active ? "border-ink bg-surface shadow-[var(--shadow-md)]" : "border-line bg-surface-2 hover:bg-surface",
                )}
              >
                <div className="flex items-center justify-between">
                  <LevelTag level={lvl} />
                  <span className="text-xs text-mute tabular">{done}/{items.length}</span>
                </div>
                <div className="mt-2 text-sm font-medium">{LEVEL_META[lvl].label}</div>
                <Progress className="mt-2 h-1.5" value={items.length ? (done / items.length) * 100 : 0} />
              </Link>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-mute">Bu darajada hali darslar e&apos;lon qilinmagan.</p>
      ) : (
        <ol className="relative grid gap-3 md:grid-cols-2">
          {visible.map((l, i) => {
            const state = l.passed ? "done" : l.unlocked ? "open" : "locked";
            const isCurrent = current?.id === l.id;
            const body = (
              <div
                className={cn(
                  "group flex h-full items-start gap-4 rounded-[14px] border p-4 transition animate-fade-up",
                  state === "locked" ? "border-line bg-surface-2/60" : "border-line bg-surface hover:border-line-strong hover:shadow-[var(--shadow-md)]",
                  isCurrent && "border-brand/50 ring-4 ring-brand/8",
                )}
                style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
              >
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-xl font-mono text-sm font-semibold",
                    state === "done" && "bg-brand text-brand-ink",
                    state === "open" && "bg-brand-soft text-brand",
                    state === "locked" && "bg-sunken text-faint",
                  )}
                >
                  {state === "done" ? <Check className="size-5" /> : state === "locked" ? <Lock className="size-4" /> : l.position}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-mute">
                    <span className="font-mono">{l.position}-dars</span>
                    {l.has_video && <Video className="size-3.5" />}
                    {isCurrent && <span className="font-medium text-brand">· Hozirgi</span>}
                  </div>
                  <div className={cn("mt-0.5 truncate font-medium", state === "locked" ? "text-mute" : "text-ink")}>{l.title}</div>
                  <div className="truncate text-sm text-mute">{l.title_uz}</div>
                </div>
                <div className="shrink-0 text-right">
                  {l.attempts > 0 ? (
                    <div className={cn("font-mono text-sm font-semibold", l.passed ? "text-brand" : "text-danger")}>{l.best_score}%</div>
                  ) : state === "open" ? (
                    <PlayCircle className="size-5 text-brand transition group-hover:scale-110" />
                  ) : null}
                </div>
              </div>
            );
            return (
              <li key={l.id}>
                {state === "locked" ? (
                  <div title={`Oldingi darsni kamida ${passScore}% bilan topshiring`} aria-disabled>{body}</div>
                ) : (
                  <Link href={`/learn/${l.id}`}>{body}</Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
