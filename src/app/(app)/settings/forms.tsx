"use client";

import { useActionState, useEffect, useState } from "react";
import { Camera, Loader2, Monitor, Moon, Sun } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { changePassword, updateProfile } from "./actions";
import { Field, FormMessage, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { LEVELS, type Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, null);
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) return alert("Rasm 2 MB dan kichik bo'lsin");
    setUploading(true);
    const supabase = supabaseBrowser();
    const path = `${profile.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) setAvatar(supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl);
    setUploading(false);
  };

  return (
    <form action={action} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar name={profile.full_name} src={avatar || null} size={64} />
          <label className="absolute -bottom-1 -right-1 grid size-7 cursor-pointer place-items-center rounded-full border-2 border-surface bg-ink text-paper">
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        </div>
        <div className="text-sm text-mute">PNG yoki JPG, 2 MB gacha</div>
      </div>
      <input type="hidden" name="avatar_url" value={avatar} />
      <Field label="Ism va familiya" htmlFor="full_name"><Input id="full_name" name="full_name" defaultValue={profile.full_name} required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefon" htmlFor="phone"><Input id="phone" name="phone" defaultValue={profile.phone ?? ""} /></Field>
        <Field label="Maqsadli daraja" htmlFor="target_level">
          <Select id="target_level" name="target_level" defaultValue={profile.target_level}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select>
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton>Saqlash</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  return (
    <form action={action} className="space-y-4">
      <Field label="Yangi parol" htmlFor="password"><Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" /></Field>
      <FormMessage state={state} />
      <SubmitButton variant="secondary">Parolni yangilash</SubmitButton>
    </form>
  );
}

export function ThemePicker() {
  const [theme, setTheme] = useState<string>("system");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- read browser-only preference after hydration
  useEffect(() => { try { setTheme(localStorage.getItem("theme") ?? "system"); } catch {} }, []);
  const apply = (t: string) => {
    setTheme(t);
    try { localStorage.setItem("theme", t); } catch {}
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      {[["light", "Yorug'", Sun], ["dark", "Qorong'i", Moon], ["system", "Tizim", Monitor]].map(([k, l, I]) => {
        const Icon = I as typeof Sun;
        return (
          <button key={k as string} type="button" onClick={() => apply(k as string)} className={cn("flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition", theme === k ? "border-brand bg-brand-softer text-brand" : "border-line hover:bg-surface-2")}>
            <Icon className="size-5" /> {l as string}
          </button>
        );
      })}
    </div>
  );
}
