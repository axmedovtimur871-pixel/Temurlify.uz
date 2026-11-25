"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Layers, Loader2 } from "lucide-react";
import { addLessonCards, markVideoWatched } from "../actions";
import { Button, LinkButton } from "@/components/ui/button";

export function VideoPlayer({ lessonId, src, embed, watched }: { lessonId: string; src: string | null; embed: string | null; watched: boolean }) {
  const [done, setDone] = useState(watched);
  const [pending, start] = useTransition();
  const mark = () => start(async () => { await markVideoWatched(lessonId); setDone(true); });

  return (
    <div>
      <div className="overflow-hidden rounded-[14px] border border-line bg-ink shadow-[var(--shadow-md)]">
        {src ? (
          <video src={src} controls playsInline preload="metadata" className="aspect-video w-full" onEnded={() => !done && mark()} />
        ) : (
          <iframe src={embed!} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen title="Video dars" />
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        {done ? (
          <span className="inline-flex items-center gap-1.5 text-brand"><CheckCircle2 className="size-4" /> Video ko&apos;rildi</span>
        ) : (
          <span className="text-mute">Videoni oxirigacha ko&apos;ring</span>
        )}
        {!done && (
          <Button variant="ghost" size="sm" onClick={mark} disabled={pending}>
            {pending && <Loader2 className="size-3.5 animate-spin" />} Ko&apos;rdim deb belgilash
          </Button>
        )}
      </div>
    </div>
  );
}

export function AddCardsButton({ lessonId }: { lessonId: string }) {
  const [state, setState] = useState<{ added?: number; error?: string } | null>(null);
  const [pending, start] = useTransition();
  if (state?.added !== undefined) {
    return (
      <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-soft px-3.5 py-2.5 text-sm text-brand">
        <span>{state.added > 0 ? `${state.added} ta so'z qo'shildi` : "So'zlar allaqachon qo'shilgan"}</span>
        <LinkButton href="/flashcards" size="sm" variant="primary">Takrorlash</LinkButton>
      </div>
    );
  }
  return (
    <>
      <Button variant="soft" className="mt-4 w-full" disabled={pending} onClick={() => start(async () => setState(await addLessonCards(lessonId)))}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Layers className="size-4" />} Kartochkalarga qo&apos;shish
      </Button>
      {state?.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
    </>
  );
}
