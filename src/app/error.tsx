"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-4xl">Nimadir xato ketdi</h1>
      <p className="mt-3 text-mute">Sahifani yuklashda muammo yuz berdi. Qayta urinib ko&apos;ring.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-faint">{error.digest}</p>}
      <Button className="mt-8" onClick={reset}>Qayta urinish</Button>
    </main>
  );
}
