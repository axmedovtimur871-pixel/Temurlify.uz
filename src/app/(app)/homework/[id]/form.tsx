"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Mic, Paperclip, Square, Trash2, Upload } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { submitHomework } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { formatDate } from "@/lib/utils";
import type { Skill } from "@/lib/types";

type Existing = { text: string; filePath: string | null; fileUrl: string | null; status: string; submittedAt: string } | null;

export function SubmissionForm({ homework, userId, existing }: { homework: { id: string; skill: Skill; min_words: number | null }; userId: string; existing: Existing }) {
  const locked = existing?.status === "graded";
  const [text, setText] = useState(existing?.text ?? "");
  const [filePath, setFilePath] = useState<string | null>(existing?.filePath ?? null);
  const [preview, setPreview] = useState<string | null>(existing?.fileUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ error?: string; ok?: string } | null>(null);
  const [pending, start] = useTransition();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const upload = async (blob: Blob, ext: string) => {
    setUploading(true);
    setMsg(null);
    const path = `submissions/${userId}/${homework.id}-${Date.now()}.${ext}`;
    const { error } = await supabaseBrowser().storage.from("homework").upload(path, blob, { upsert: true, contentType: blob.type || undefined });
    setUploading(false);
    if (error) { setMsg({ error: "Yuklashda xato: " + error.message }); return; }
    setFilePath(path);
    setPreview(URL.createObjectURL(blob));
  };

  const submit = () => start(async () => {
    if (homework.skill === "schreiben" && homework.min_words && words < homework.min_words) {
      setMsg({ error: `Kamida ${homework.min_words} ta so'z yozing (hozir ${words}).` });
      return;
    }
    const res = await submitHomework({ homeworkId: homework.id, text, filePath });
    setMsg(res.error ? { error: res.error } : { ok: "Vazifa topshirildi! O'qituvchi tekshirgach, bildirishnoma olasiz." });
  });

  if (locked) {
    return (
      <div className="card p-5">
        <h2 className="font-medium">Sizning javobingiz</h2>
        {existing?.text && <p className="mt-2 whitespace-pre-line text-ink-2">{existing.text}</p>}
        {preview && <audio controls src={preview} className="mt-3 w-full" />}
      </div>
    );
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{existing ? "Javobni yangilash" : "Javobingiz"}</h2>
        {existing && <span className="text-xs text-mute">Topshirilgan: {formatDate(existing.submittedAt, true)}</span>}
      </div>

      {homework.skill === "sprechen" && (
        <div className="mt-4">
          <Recorder onRecorded={(blob) => upload(blob, blob.type.includes("mp4") ? "m4a" : "webm")} disabled={uploading} />
        </div>
      )}

      <div className="mt-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={homework.skill === "sprechen" ? "Izoh (ixtiyoriy)…" : "Javobingizni nemis tilida yozing…"}
          className={homework.skill === "schreiben" ? "min-h-64" : ""}
          lang="de"
        />
        <div className="mt-1.5 flex justify-between text-xs text-mute">
          <span>{words} so&apos;z{homework.min_words ? ` · kamida ${homework.min_words}` : ""}</span>
        </div>
      </div>

      {preview && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
          {filePath && /\.(webm|m4a|mp3|wav|ogg)$/i.test(filePath) ? <audio controls src={preview} className="h-10 flex-1" /> : <span className="flex-1 truncate text-sm">{filePath?.split("/").pop()}</span>}
          <button onClick={() => { setFilePath(null); setPreview(null); }} className="grid size-9 place-items-center rounded-lg text-mute hover:bg-sunken hover:text-danger" aria-label="O'chirish"><Trash2 className="size-4" /></button>
        </div>
      )}

      {msg && <p className={`mt-4 rounded-[10px] px-3.5 py-2.5 text-sm ${msg.error ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand"}`}>{msg.error ?? <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4" /> {msg.ok}</span>}</p>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-2 hover:text-ink">
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />} Fayl biriktirish
          <input type="file" className="hidden" accept="audio/*,image/*,.pdf,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, f.name.split(".").pop() || "bin"); }} />
        </label>
        <Button size="lg" onClick={submit} disabled={pending || uploading}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {existing ? "Qayta topshirish" : "Topshirish"}
        </Button>
      </div>
    </div>
  );
}

function Recorder({ onRecorded, disabled }: { onRecorded: (b: Blob) => void; disabled?: boolean }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const startRec = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const r = new MediaRecorder(stream, { mimeType: type });
      const chunks: BlobPart[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        onRecorded(new Blob(chunks, { type }));
      };
      r.start();
      rec.current = r;
      setRecording(true);
      setSeconds(0);
      timer.current = window.setInterval(() => setSeconds((s) => { if (s >= 299) stopRec(); return s + 1; }), 1000);
    } catch {
      setError("Mikrofonga ruxsat berilmadi.");
    }
  };
  const stopRec = () => {
    rec.current?.stop();
    setRecording(false);
    if (timer.current) clearInterval(timer.current);
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-surface-2 p-4">
      <button
        type="button"
        disabled={disabled}
        onClick={recording ? stopRec : startRec}
        className={`relative grid size-14 shrink-0 place-items-center rounded-full text-white transition ${recording ? "bg-danger" : "bg-brand hover:bg-brand-hover"}`}
        aria-label={recording ? "To'xtatish" : "Yozishni boshlash"}
      >
        {recording && <span className="absolute inset-0 animate-ping rounded-full bg-danger/40" />}
        {recording ? <Square className="relative size-5 fill-current" /> : <Mic className="size-6" />}
      </button>
      <div>
        <div className="font-medium">{recording ? "Yozilmoqda…" : "Ovozli javob"}</div>
        <div className="text-sm text-mute tabular">
          {recording ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} / 5:00` : "Tugmani bosing va gapiring"}
        </div>
        {error && <div className="text-sm text-danger">{error}</div>}
      </div>
    </div>
  );
}
