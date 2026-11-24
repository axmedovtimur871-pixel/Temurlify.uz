"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { buttonClass } from "@/components/ui/button";

/** Uploads straight from the browser to Supabase Storage (RLS decides who may write). */
export function FileUpload({
  bucket, folder, accept, label = "Fayl yuklash", onUploaded, maxMb = 50,
}: { bucket: string; folder: string; accept?: string; label?: string; onUploaded: (path: string, file: File) => void | Promise<void>; maxMb?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (file: File) => {
    setError(null);
    if (file.size > maxMb * 1024 * 1024) { setError(`Fayl ${maxMb} MB dan katta. Katta videolar uchun YouTube/Vimeo havolasidan foydalaning.`); return; }
    setBusy(true);
    const safe = file.name.normalize("NFKD").replace(/[^\w.-]+/g, "-").toLowerCase();
    const path = `${folder}/${Date.now()}-${safe}`;
    const { error } = await supabaseBrowser().storage.from(bucket).upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) setError(error.message);
    else await onUploaded(path, file);
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  return (
    <div>
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className={buttonClass({ variant: "secondary", size: "sm" })}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {busy ? "Yuklanmoqda…" : label}
      </button>
      <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
