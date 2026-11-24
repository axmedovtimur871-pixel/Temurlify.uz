"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Toast = { id: string; title: string; body: string; link: string | null };

/** Bell with live unread count and toast for new notifications (Supabase Realtime). */
export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload: { new: Record<string, unknown> }) => {
          const n = payload.new as unknown as Toast;
          setUnread((u) => u + 1);
          setToast(n);
          window.setTimeout(() => setToast((t) => (t?.id === n.id ? null : t)), 6000);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        async () => {
          const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
          setUnread(count ?? 0);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <>
      <Link
        href="/notifications"
        className="relative grid size-9 place-items-center rounded-[10px] text-ink-2 transition hover:bg-sunken hover:text-ink"
        aria-label={`Bildirishnomalar${unread ? ` (${unread} ta yangi)` : ""}`}
      >
        <Bell className="size-[18px]" strokeWidth={1.9} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
      {toast && (
        <Link
          href={toast.link ?? "/notifications"}
          onClick={() => setToast(null)}
          className={cn(
            "card fixed bottom-24 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] animate-pop gap-3 p-4 shadow-[var(--shadow-lg)] lg:bottom-6",
          )}
        >
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Bell className="size-4" /></span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">{toast.title}</span>
            {toast.body && <span className="mt-0.5 line-clamp-2 block text-[13px] text-mute">{toast.body}</span>}
          </span>
        </Link>
      )}
    </>
  );
}
