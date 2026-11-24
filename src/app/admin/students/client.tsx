"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, UserPlus, X } from "lucide-react";
import { createStudent, updateStudent } from "../actions";
import { Button, SubmitButton } from "@/components/ui/button";
import { Field, FormMessage, Input, Select } from "@/components/ui/field";
import type { Role } from "@/lib/types";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
      <button className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-label="Yopish" />
      <div className="relative max-h-[92vh] w-full animate-pop overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 shadow-[var(--shadow-lg)] sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl">{title}</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-sunken" aria-label="Yopish"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CreateStudent({ groups }: { groups: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createStudent, null);
  const [tempPassword] = useState(() => Math.random().toString(36).slice(2, 10));
  return (
    <>
      <Button onClick={() => setOpen(true)}><UserPlus className="size-4" /> Talaba qo&apos;shish</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Yangi talaba">
        <form action={action} className="space-y-4">
          <Field label="Ism va familiya" htmlFor="fn"><Input id="fn" name="full_name" required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email (login)" htmlFor="em"><Input id="em" name="email" type="email" required /></Field>
            <Field label="Telefon" htmlFor="ph"><Input id="ph" name="phone" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vaqtinchalik parol" hint="Talabaga bering" htmlFor="pw"><Input id="pw" name="password" minLength={8} required defaultValue={tempPassword} /></Field>
            <Field label="Guruh" htmlFor="gr"><Select id="gr" name="group_id"><option value="">—</option>{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select></Field>
          </div>
          <FormMessage state={state} />
          <SubmitButton className="w-full">Qo&apos;shish</SubmitButton>
        </form>
      </Modal>
    </>
  );
}

export function RowControls({ id, groupId, groups, active, role, canRole }: { id: string; groupId: string | null; groups: { id: string; name: string }[]; active: boolean; role: Role; canRole: boolean }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const run = (patch: Parameters<typeof updateStudent>[1]) => start(async () => { const r = await updateStudent(id, patch); setErr(r.error ?? null); });
  return (
    <div className="flex items-center justify-end gap-2">
      {pending && <Loader2 className="size-4 animate-spin text-mute" />}
      {err && <span className="text-xs text-danger">{err}</span>}
      <select aria-label="Guruh" defaultValue={groupId ?? ""} onChange={(e) => run({ group_id: e.target.value || null })} className="h-8 max-w-36 rounded-lg border border-line bg-surface px-2 text-xs">
        <option value="">Guruhsiz</option>
        {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      {canRole && (
        <select aria-label="Rol" defaultValue={role} onChange={(e) => run({ role: e.target.value as Role })} className="h-8 rounded-lg border border-line bg-surface px-2 text-xs">
          <option value="student">Talaba</option><option value="teacher">O&apos;qituvchi</option><option value="admin">Admin</option>
        </select>
      )}
      <button onClick={() => run({ is_active: !active })} className="h-8 rounded-lg border border-line px-2.5 text-xs text-ink-2 hover:bg-surface-2">{active ? "Bloklash" : "Faollashtirish"}</button>
    </div>
  );
}
