"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, Settings, ShieldCheck, X, Flame } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Avatar } from "@/components/ui/misc";
import { NotificationBell } from "./notification-bell";
import { STUDENT_NAV, STUDENT_MOBILE } from "./nav";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const isActive = (path: string, href: string) => path === href || (href !== "/dashboard" && path.startsWith(href + "/")) || path === href;

export function AppShell({ profile, unread, children }: { profile: Profile; unread: number; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isStaff = profile.role !== "student";

  const navLinks = (onNavigate?: () => void) => (
    <nav className="space-y-0.5">
      {STUDENT_NAV.map((item) => {
        const active = isActive(path, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] transition",
              active ? "bg-surface font-medium text-ink shadow-[var(--shadow-sm)] ring-1 ring-line" : "text-ink-2 hover:bg-sunken/70 hover:text-ink",
            )}
          >
            <item.icon className={cn("size-[18px]", active ? "text-brand" : "text-mute group-hover:text-ink-2")} strokeWidth={1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (onNavigate?: () => void) => (
    <div className="space-y-0.5 border-t border-line pt-3">
      {isStaff && (
        <Link href="/admin" onClick={onNavigate} className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] text-ink-2 hover:bg-sunken/70 hover:text-ink">
          <ShieldCheck className="size-[18px] text-saffron" strokeWidth={1.9} /> Admin panel
        </Link>
      )}
      <Link href="/settings" onClick={onNavigate} className={cn("flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] hover:bg-sunken/70 hover:text-ink", path === "/settings" ? "text-ink" : "text-ink-2")}>
        <Settings className="size-[18px] text-mute" strokeWidth={1.9} /> Sozlamalar
      </Link>
      <form action={signOut}>
        <button className="flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-[14px] text-ink-2 hover:bg-sunken/70 hover:text-ink">
          <LogOut className="size-[18px] text-mute" strokeWidth={1.9} /> Chiqish
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-surface-2/60 px-3 py-5 lg:flex">
        <Link href="/dashboard" className="px-2"><Logo /></Link>
        <div className="flex-1 overflow-y-auto no-scrollbar">{navLinks()}</div>
        {footer()}
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-md sm:px-6">
          <Link href="/dashboard" className="lg:hidden"><Logo compact /></Link>
          <div className="flex-1" />
          <div className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] sm:flex" title="Ketma-ket kunlar">
            <Flame className={cn("size-4", profile.streak > 0 ? "text-saffron" : "text-faint")} />
            <span className="font-medium tabular">{profile.streak}</span>
            <span className="text-mute">kun</span>
            <span className="mx-1.5 h-3.5 w-px bg-line" />
            <span className="font-medium tabular">{profile.xp}</span>
            <span className="text-mute">XP</span>
          </div>
          <NotificationBell userId={profile.id} initialUnread={unread} />
          <Link href="/settings" className="flex items-center gap-2.5 rounded-full p-0.5 pr-1 hover:bg-sunken sm:pr-3">
            <Avatar name={profile.full_name} src={profile.avatar_url} size={32} />
            <span className="hidden max-w-36 truncate text-sm font-medium sm:block">{profile.full_name.split(" ")[0]}</span>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-5">
          {STUDENT_NAV.filter((i) => STUDENT_MOBILE.includes(i.href)).map((item) => {
            const active = isActive(path, item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px]", active ? "text-brand" : "text-mute")}>
                <item.icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-mute">
            <Menu className="size-5" strokeWidth={1.8} /> Ko&apos;proq
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" aria-label="Yopish" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-fade-up overflow-y-auto rounded-t-2xl border-t border-line bg-paper p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="font-medium">Menyu</span>
              <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg hover:bg-sunken" aria-label="Yopish"><X className="size-5" /></button>
            </div>
            {navLinks(() => setOpen(false))}
            <div className="mt-3">{footer(() => setOpen(false))}</div>
          </div>
        </div>
      )}
    </div>
  );
}
