import Link from "next/link";
import type { Metadata } from "next";
import { Award, Bell, BellOff, BookOpen, CheckCheck, ClipboardList, Megaphone, Star, X } from "lucide-react";
import { supabaseServer } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { cn, timeAgo } from "@/lib/utils";
import { deleteNotification, markAllRead } from "./actions";
import type { Notification } from "@/lib/types";

export const metadata: Metadata = { title: "Bildirishnomalar" };

const KIND = {
  announcement: { icon: Megaphone, cls: "bg-info-soft text-info" },
  homework: { icon: ClipboardList, cls: "bg-saffron-soft text-saffron" },
  grade: { icon: Star, cls: "bg-brand-soft text-brand" },
  achievement: { icon: Award, cls: "bg-saffron-soft text-saffron" },
  lesson: { icon: BookOpen, cls: "bg-brand-soft text-brand" },
  info: { icon: Bell, cls: "bg-sunken text-ink-2" },
} as const;

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = await supabaseServer();
  const [{ data }, { data: announcements }] = await Promise.all([
    supabase.from("notifications").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("announcements").select("*").eq("pinned", true).order("created_at", { ascending: false }).limit(3),
  ]);
  const items = (data ?? []) as Notification[];
  const unread = items.filter((n) => !n.read_at).length;

  // Mark as read once the page has been seen (the badge clears via realtime).
  if (unread > 0) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", profile.id).is("read_at", null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Bildirishnomalar"
        description={unread ? `${unread} ta yangi` : "Hammasi o'qilgan"}
        actions={items.length > 0 && <form action={markAllRead}><Button variant="secondary" size="sm"><CheckCheck className="size-4" /> Hammasini o&apos;qilgan qilish</Button></form>}
      />

      {(announcements ?? []).length > 0 && (
        <div className="mb-6 space-y-2">
          {(announcements ?? []).map((a) => (
            <div key={a.id} className="rounded-[14px] border border-saffron/40 bg-saffron-soft px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-medium"><Megaphone className="size-4 text-saffron" /> {a.title}</div>
              <p className="mt-1 whitespace-pre-line text-sm text-ink-2">{a.body}</p>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={BellOff} title="Bildirishnomalar yo'q" text="Yangi dars ochilganda, vazifa baholanganda yoki e'lon chiqqanda shu yerda ko'rasiz." />
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {items.map((n) => {
            const k = KIND[n.kind as keyof typeof KIND] ?? KIND.info;
            const content = (
              <>
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", k.cls)}><k.icon className="size-[18px]" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    {!n.read_at && <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Yangi" />}
                    <span className="truncate text-sm font-medium text-ink">{n.title}</span>
                  </span>
                  {n.body && <span className="mt-0.5 line-clamp-2 block text-[13px] text-mute">{n.body}</span>}
                  <span className="mt-1 block text-[11.5px] text-faint">{timeAgo(n.created_at)}</span>
                </span>
              </>
            );
            return (
              <li key={n.id} className={cn("group flex items-start gap-3 px-4 py-4 sm:px-5", !n.read_at && "bg-brand-softer/60")}>
                {n.link ? <Link href={n.link} className="flex min-w-0 flex-1 items-start gap-3">{content}</Link> : <div className="flex min-w-0 flex-1 items-start gap-3">{content}</div>}
                <form action={deleteNotification.bind(null, n.id)}>
                  <button className="grid size-8 place-items-center rounded-lg text-faint opacity-0 transition hover:bg-sunken hover:text-ink group-hover:opacity-100 focus:opacity-100" aria-label="O'chirish"><X className="size-4" /></button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
