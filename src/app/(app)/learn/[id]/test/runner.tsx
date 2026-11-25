"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, RotateCcw, X, XCircle, Sparkles } from "lucide-react";
import { submitTest, type TestResult } from "../../actions";
import { Button, LinkButton } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { LevelTag, Progress, Ring } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { Level, Question } from "@/lib/types";

type Answer = number | number[] | string;

export function TestRunner({ lesson, questions, passScore }: {
  lesson: { id: string; title: string; position: number; level: Level };
  questions: Question[];
  passScore: number;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const q = questions[index];
  const answered = useMemo(() => questions.filter((x) => {
    const a = answers[x.id];
    return a !== undefined && a !== "" && !(Array.isArray(a) && a.length === 0);
  }).length, [answers, questions]);

  const set = useCallback((value: Answer) => setAnswers((a) => ({ ...a, [q.id]: value })), [q]);

  const submit = () => start(async () => {
    setError(null);
    const res = await submitTest(lesson.id, answers);
    if (res.error) setError(res.error);
    else { setResult(res.data!); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });

  useEffect(() => {
    if (result || !q || q.kind === "text") return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) {
        if (q.kind === "single") set(n - 1);
        else {
          const cur = (answers[q.id] as number[] | undefined) ?? [];
          set(cur.includes(n - 1) ? cur.filter((x) => x !== n - 1) : [...cur, n - 1]);
        }
      }
      if (e.key === "Enter" && index < questions.length - 1) setIndex((i) => i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, set, answers, index, questions.length, result]);

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <h1 className="font-display text-3xl">Bu darsda test savollari yo&apos;q</h1>
        <p className="mt-2 text-mute">Darsni tugatilgan deb belgilashingiz mumkin — keyingi dars ochiladi.</p>
        <Button className="mt-6" size="lg" disabled={pending} onClick={submit}>
          {pending && <Loader2 className="size-4 animate-spin" />} Darsni tugatish
        </Button>
        {result && <div className="mt-6"><LinkButton href={result.next_lesson ? `/learn/${result.next_lesson}` : "/learn"}>Davom etish</LinkButton></div>}
      </div>
    );
  }

  if (result) return <ResultView result={result} questions={questions} answers={answers} lesson={lesson} onRetry={() => { setResult(null); setAnswers({}); setIndex(0); }} />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <Link href={`/learn/${lesson.id}`} className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"><X className="size-4" /> Chiqish</Link>
        <div className="flex items-center gap-2 text-sm text-mute"><LevelTag level={lesson.level} /> {lesson.position}-dars testi</div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <Progress value={((index + 1) / questions.length) * 100} className="flex-1" />
        <span className="font-mono text-sm text-mute tabular">{index + 1}/{questions.length}</span>
      </div>

      <div key={q.id} className="mt-10 animate-fade-up">
        <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-mute">
          {q.kind === "text" ? "Javobni yozing" : q.kind === "multi" ? "Bir nechta javob" : "Bitta javobni tanlang"}
        </p>
        <h1 className="mt-3 font-display text-[1.9rem] leading-snug sm:text-[2.3rem]">{q.prompt}</h1>

        {q.kind === "text" ? (
          <div className="mt-8">
            <Input
              autoFocus
              value={(answers[q.id] as string) ?? ""}
              onChange={(e) => set(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && index < questions.length - 1) setIndex(index + 1); }}
              placeholder="Nemischa javob…"
              className="h-14 text-lg"
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"].map((ch) => (
                <button key={ch} type="button" onClick={() => set(((answers[q.id] as string) ?? "") + ch)} className="h-9 min-w-9 rounded-lg border border-line bg-surface px-2 font-medium hover:bg-surface-2">{ch}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-2.5">
            {q.options.map((opt, i) => {
              const selected = q.kind === "single" ? answers[q.id] === i : ((answers[q.id] as number[] | undefined) ?? []).includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (q.kind === "single") set(i);
                    else {
                      const cur = (answers[q.id] as number[] | undefined) ?? [];
                      set(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-4 rounded-[14px] border px-4 py-4 text-left text-[16px] transition",
                    selected ? "border-brand bg-brand-softer ring-4 ring-brand/10" : "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
                  )}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg border font-mono text-[13px]", selected ? "border-brand bg-brand text-brand-ink" : "border-line text-mute")}>
                    {selected ? <Check className="size-4" /> : i + 1}
                  </span>
                  <span className="text-ink">{opt}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="mt-6 rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

      <div className="mt-10 flex items-center justify-between border-t border-line pt-5">
        <Button variant="ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft className="size-4" /> Orqaga</Button>
        <div className="hidden gap-1 sm:flex">
          {questions.map((x, i) => (
            <button
              key={x.id}
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}-savol`}
              className={cn("size-2.5 rounded-full transition", i === index ? "bg-ink" : answers[x.id] !== undefined && answers[x.id] !== "" ? "bg-brand" : "bg-line-strong")}
            />
          ))}
        </div>
        {index < questions.length - 1 ? (
          <Button onClick={() => setIndex(index + 1)}>Keyingi <ArrowRight className="size-4" /></Button>
        ) : (
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />} Topshirish {answered < questions.length && <span className="opacity-70">({answered}/{questions.length})</span>}
          </Button>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-faint">O&apos;tish bali {passScore}% · Klaviatura: 1–4 tanlash, Enter keyingisi</p>
    </div>
  );
}

function ResultView({ result, questions, answers, lesson, onRetry }: {
  result: TestResult; questions: Question[]; answers: Record<string, Answer>;
  lesson: { id: string; title: string; position: number }; onRetry: () => void;
}) {
  const byId = new Map(result.results.map((r) => [r.question_id, r]));
  const describe = (q: Question, a: Answer | undefined) => {
    if (a === undefined || a === "") return "Javob berilmagan";
    if (q.kind === "text") return String(a);
    if (Array.isArray(a)) return a.map((i) => q.options[i]).join(", ");
    return q.options[a as number];
  };
  const keyText = (q: Question, key?: TestResult["results"][number]["key"]) => {
    if (!key) return null;
    if (key.accepted) return key.accepted[0];
    if (key.indexes) return key.indexes.map((i) => q.options[i]).join(", ");
    if (key.index !== undefined) return q.options[key.index];
    return null;
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card animate-pop overflow-hidden text-center">
        <div className={cn("px-6 pb-8 pt-10", result.passed ? "bg-brand-softer" : "bg-danger-soft/50")}>
          <Ring value={result.score} size={132} stroke={10} tone={result.passed ? "brand" : "saffron"}>
            <div>
              <div className="font-display text-4xl tabular">{result.score}%</div>
              <div className="text-xs text-mute">{result.correct}/{result.total}</div>
            </div>
          </Ring>
          <h1 className="mt-5 font-display text-3xl">{result.passed ? "Ajoyib, test topshirildi!" : "Bu safar yetmadi"}</h1>
          <p className="mt-1.5 text-ink-2">
            {result.passed
              ? result.newly_passed && result.next_lesson ? "Keyingi dars ochildi." : `O'tish bali ${result.pass_score}% edi.`
              : `O'tish uchun kamida ${result.pass_score}% kerak. Darsni takrorlab, qayta urinib ko'ring.`}
          </p>
          {result.newly_passed && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-saffron-soft px-3 py-1 text-sm font-medium"><Sparkles className="size-4 text-saffron" /> +50 XP</p>
          )}
        </div>
        <div className="flex flex-col gap-2 border-t border-line p-4 sm:flex-row sm:justify-center">
          {result.passed && result.next_lesson && <LinkButton href={`/learn/${result.next_lesson}`} size="lg">Keyingi dars <ArrowRight className="size-4" /></LinkButton>}
          <Button variant="secondary" size="lg" onClick={onRetry}><RotateCcw className="size-4" /> Qayta topshirish</Button>
          <LinkButton href={`/learn/${lesson.id}`} variant="ghost" size="lg">Darsga qaytish</LinkButton>
        </div>
      </div>

      <h2 className="mb-3 mt-10 font-medium">Savollar tahlili</h2>
      <ol className="space-y-3">
        {questions.map((q, i) => {
          const r = byId.get(q.id);
          const correct = r?.correct;
          return (
            <li key={q.id} className="card p-4">
              <div className="flex gap-3">
                {correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-danger" />}
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-ink">{i + 1}. {q.prompt}</p>
                  <p className="mt-1 text-mute">Sizning javobingiz: <span className={correct ? "text-brand" : "text-danger"}>{describe(q, answers[q.id])}</span></p>
                  {!correct && keyText(q, r?.key) && <p className="mt-0.5 text-mute">To&apos;g&apos;ri javob: <span className="text-ink">{keyText(q, r?.key)}</span></p>}
                  {r?.explanation && (correct || r.key) && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-ink-2">{r.explanation}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {!result.passed && <p className="mt-4 text-center text-sm text-mute">To&apos;g&apos;ri javoblar test topshirilgandan keyin ko&apos;rsatiladi.</p>}
    </div>
  );
}
