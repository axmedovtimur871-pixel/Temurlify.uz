"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { saveAttendance } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Avatar } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

type Status = "present" | "late" | "absent" | "excused";
const OPTIONS: { k: Status; l: string; cls: string }[] = [
  { k: "present", l: "Keldi", cls: "border-brand bg-brand text-brand-ink" },
  { k: "late", l: "Kechikdi", cls: "border-saffron bg-saffron text-ink" },
  { k: "absent", l: "Kelmadi", cls: "border-danger bg-danger text-white" },
  { k: "excused", l: "Sababli", cls: "border-info bg-info text-white" },
];

export function AttendanceSheet({ groupId, date, topic: t0, students, existing }: { groupId: string; date: string; topic: string; students: { id: string; full_name: string; avatar_url: string | null }[]; existing: Record<string, string> }) {
  const [records, setRecords] = useState<Record<string, Status>>(() => Object.fromEntries(students.map((s) => [s.id, (existing[s.id] as Status) ?? "present"])));
  const [topic, setTopic] = useState(t0);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const counts = OPTIONS.map((o) => ({ ...o, n: Object.values(records).filter((r) => r === o.k).length }));

  if (students.length === 0) return <div className="card p-8 text-center text-sm text-mute">Bu guruhda faol talabalar yo&apos;q.</div>;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Dars mavzusi (ixtiyoriy)" className="h-10 sm:max-w-xs" />
        <div className="flex flex-wrap gap-3 text-xs text-mute sm:ml-auto">{counts.map((c) => <span key={c.k}>{c.l}: <strong className="text-ink">{c.n}</strong></span>)}</div>
      </div>
      <ul className="divide-y divide-line">
        {students.map((s) => (
          <li key={s.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3"><Avatar name={s.full_name} src={s.avatar_url} size={32} /><span className="text-sm font-medium">{s.full_name}</span></div>
            <div className="flex gap-1">
              {OPTIONS.map((o) => (
                <button key={o.k} onClick={() => setRecords({ ...records, [s.id]: o.k })} className={cn("h-8 rounded-lg border px-2.5 text-xs transition", records[s.id] === o.k ? o.cls : "border-line text-mute hover:bg-surface-2")}>{o.l}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-end gap-3 border-t border-line bg-surface-2 p-4">
        {msg && <span className="text-sm text-mute">{msg}</span>}
        <Button disabled={pending} onClick={() => start(async () => { const r = await saveAttendance({ groupId, date, topic, records }); setMsg(r.error ?? "Saqlandi"); })}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Saqlash
        </Button>
      </div>
    </div>
  );
}
