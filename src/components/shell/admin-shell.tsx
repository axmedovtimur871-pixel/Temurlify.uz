"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, LogOut, Menu, X } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { Avatar, Badge } from "@/components/ui/misc";
import { ADMIN_NAV } from "./nav";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function AdminShell({ profile, toGrade, children }: { profile: Profile; toGrade: number; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));

  const nav = (onNavigate?: () => void) => (
    <nav className="space-y-6">
      {ADMIN_NAV.map((g) => (
        <div key={g.group}>
          <div className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-paper/40">{g.group}</div>
          <div className="space-y-0.5">
            {g.items.filter((i) => i.href !== "/admin/settings" || profile.role === "admin").map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={onNavigate}
                className={cn("flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] transition", active(i.href) ? "bg-paper/10 text-paper" : "text-paper/65 hover:bg-paper/5 hover:text-paper")}
              >
                <i.icon className={cn("size-[17px]", active(i.href) ? "text-saffron" : "")} strokeWidth={1.8} />
                <span className="flex-1">{i.label}</span>
                {i.href === "/admin/homework" && toGrade > 0 && <span className="rounded-full bg-saffron px-1.5 text-[11px] font-semibold text-ink">{toGrade}</span>}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const side = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col bg-ink px-3 py-5 text-paper [color-scheme:dark]">
      <Link href="/admin" className="flex items-center gap-2.5 px-2" onClick={onNavigate}>
        <LogoMark />
        <span className="font-display text-xl">Temurlify</span>
        <span className="rounded bg-paper/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-paper/70">Admin</span>
      </Link>
      <div className="mt-8 flex-1 overflow-y-auto no-scrollbar">{nav(onNavigate)}</div>
      <div className="mt-4 space-y-0.5 border-t border-paper/10 pt-3">
        <Link href="/dashboard" className="flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] text-paper/65 hover:bg-paper/5 hover:text-paper">
          <ArrowUpRight className="size-[17px]" /> Talaba ko&apos;rinishi
        </Link>
        <form action={signOut}>
          <button className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13.5px] text-paper/65 hover:bg-paper/5 hover:text-paper"><LogOut className="size-[17px]" /> Chiqish</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{side()}</aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-md sm:px-6">
          <button className="grid size-9 place-items-center rounded-lg hover:bg-sunken lg:hidden" onClick={() => setOpen(true)} aria-label="Menyu"><Menu className="size-5" /></button>
          <div className="flex-1" />
          <Badge tone={profile.role === "admin" ? "ink" : "neutral"}>{profile.role === "admin" ? "Administrator" : "O'qituvchi"}</Badge>
          <div className="flex items-center gap-2">
            <Avatar name={profile.full_name} src={profile.avatar_url} size={30} />
            <span className="hidden text-sm font-medium sm:block">{profile.full_name}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8">{children}</main>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} aria-label="Yopish" />
          <div className="absolute inset-y-0 left-0 w-72 animate-fade-up">
            <button className="absolute right-3 top-4 z-10 grid size-8 place-items-center rounded-lg text-paper/70 hover:bg-paper/10" onClick={() => setOpen(false)} aria-label="Yopish"><X className="size-5" /></button>
            {side(() => setOpen(false))}
          </div>
        </div>
      )}
    </div>
  );
}
