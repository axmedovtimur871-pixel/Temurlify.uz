"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { deleteHomework, gradeSubmission } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { formatDate } from "@/lib/utils";

type Sub = { id: string; text: string | null; fileUrl: string | null; filePath: string | null; score: number | null; feedback: string | null; status: string; name: string; submittedAt: string };

export function GradePanel({ submission: s, homeworkId, maxPoints, minWords }: { submission: Sub; homeworkId: string; maxPoints: number; minWords: number | null }) {
  const [score, setScore] = useState(s.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(s.feedback ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const words = s.text?.trim() ? s.text.trim().split(/\s+/).length : 0;
  const isAudio = s.filePath && /\.(webm|m4a|mp3|wav|ogg|aac)$/i.test(s.filePath);

  const submit = (status: "graded" | "returned") => start(async () => {
    const n = score === "" ? null : Math.max(0, Math.min(maxPoints, Number(score)));
    if (status === "graded" && n === null) { setMsg("Ball kiriting"); return; }
    const r = await gradeSubmission({ id: s.id, homeworkId, score: n, feedback, status });
    setMsg(r.error ?? (status === "graded" ? "Baholandi — talabaga bildirishnoma yuborildi" : "Qayta ishlashga qaytarildi"));
  });

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">{s.name}</h2>
          <p className="text-sm text-mute">{formatDate(s.submittedAt, true)} da topshirilgan</p>
        </div>
      </div>
      {s.text && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-mute"><span>Matn</span><span>{words} so&apos;z{minWords ? ` / kamida ${minWords}` : ""}</span></div>
          <div className="whitespace-pre-line rounded-xl border border-line bg-surface-2 p-4 leading-relaxed" lang="de">{s.text}</div>
        </div>
      )}
      {s.fileUrl && (
        <div className="mt-5">
          <div className="mb-1.5 text-xs text-mute">{isAudio ? "Ovozli javob" : "Fayl"}</div>
          {isAudio ? <audio controls src={s.fileUrl} className="w-full" /> : <a href={s.fileUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline">{s.filePath?.split("/").pop()}</a>}
        </div>
      )}
      <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-[140px_1fr]">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink-2" htmlFor="score">Ball / {maxPoints}</label>
          <Input id="score" type="number" min={0} max={maxPoints} value={score} onChange={(e) => setScore(e.target.value)} className="text-lg font-semibold" />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-ink-2" htmlFor="fb">Izoh</label>
          <Textarea id="fb" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Yaxshi tomonlari, xatolar va maslahatlar…" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {msg && <span className="mr-auto text-sm text-mute">{msg}</span>}
        <Button variant="secondary" disabled={pending} onClick={() => submit("returned")}><RotateCcw className="size-4" /> Qayta ishlashga</Button>
        <Button disabled={pending} onClick={() => submit("graded")}>{pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Baholash</Button>
      </div>
    </div>
  );
}

export function DeleteHomework({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="sm" className="text-danger" disabled={pending} onClick={() => confirm("Vazifa va barcha javoblar o'chirilsinmi?") && start(() => deleteHomework(id))}>
      <Trash2 className="size-4" /> O&apos;chirish
    </Button>
  );
}
