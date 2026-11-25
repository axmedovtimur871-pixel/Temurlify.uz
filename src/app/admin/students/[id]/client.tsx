"use client";

import { useState, useTransition } from "react";
import { KeyRound, Loader2, LockOpen, Trash2 } from "lucide-react";
import { deleteStudent, resetStudentPassword, unlockLesson } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export function LessonUnlock({ userId, lessonId, manual, unlocked }: { userId: string; lessonId: string; manual: boolean; unlocked: boolean }) {
  const [pending, start] = useTransition();
  if (unlocked && !manual) return null;
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => { await unlockLesson(userId, lessonId, !manual); })}
      className="grid size-6 place-items-center rounded text-mute hover:bg-sunken hover:text-brand"
      title={manual ? "Qo'lda ochilgan — yopish" : "Qo'lda ochish"}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <LockOpen className={manual ? "size-3.5 text-brand" : "size-3.5"} />}
    </button>
  );
}

export function StudentDanger({ id, canDelete }: { id: string; canDelete: boolean }) {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="card p-5">
      <h2 className="text-[15px] font-semibold">Hisob</h2>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Yangi parol (kamida 8 belgi)" className="sm:max-w-xs" />
        <Button variant="secondary" disabled={pending || pw.length < 8} onClick={() => start(async () => { const r = await resetStudentPassword(id, pw); setMsg(r.error ?? r.ok ?? null); })}>
          <KeyRound className="size-4" /> Parolni o&apos;rnatish
        </Button>
        {canDelete && (
          <Button variant="ghost" className="text-danger sm:ml-auto" onClick={() => { if (confirm("Talaba va uning barcha natijalari o'chiriladi. Davom etasizmi?")) start(() => deleteStudent(id)); }}>
            <Trash2 className="size-4" /> O&apos;chirish
          </Button>
        )}
      </div>
      {msg && <p className="mt-2 text-sm text-mute">{msg}</p>}
    </section>
  );
}
