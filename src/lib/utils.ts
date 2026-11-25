import { clsx, type ClassValue } from "clsx";
import type { Level, Skill } from "@/lib/types";

export const cn = (...v: ClassValue[]) => clsx(v);

export const LEVEL_META: Record<Level, { label: string; color: string; soft: string; text: string }> = {
  A1: { label: "Boshlang'ich", color: "bg-lvl-a1", soft: "bg-lvl-a1/10", text: "text-lvl-a1" },
  A2: { label: "Asosiy", color: "bg-lvl-a2", soft: "bg-lvl-a2/10", text: "text-lvl-a2" },
  B1: { label: "O'rta", color: "bg-lvl-b1", soft: "bg-lvl-b1/10", text: "text-lvl-b1" },
  B2: { label: "O'rtadan yuqori", color: "bg-lvl-b2", soft: "bg-lvl-b2/10", text: "text-lvl-b2" },
  C1: { label: "Ilg'or", color: "bg-lvl-c1", soft: "bg-lvl-c1/10", text: "text-lvl-c1" },
};

export const SKILL_META: Record<Skill, { de: string; uz: string; hint: string }> = {
  lesen: { de: "Lesen", uz: "O'qish", hint: "Matnni o'qing va savollarga javob bering" },
  hoeren: { de: "Hören", uz: "Tinglash", hint: "Audioni tinglang va javob yozing" },
  sprechen: { de: "Sprechen", uz: "Gapirish", hint: "Javobingizni ovozli yozib yuboring" },
  schreiben: { de: "Schreiben", uz: "Yozish", hint: "Matn yozing va topshiring" },
};

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const TZ = "Asia/Tashkent";

function parts(d: Date) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, hh: p.hour, mm: p.minute };
}

export function formatDate(value: string | Date | null | undefined, withTime = false) {
  if (!value) return "—";
  const p = parts(new Date(value));
  return `${p.d}-${MONTHS[p.m - 1]}${withTime ? `, ${p.hh}:${p.mm}` : ""}`;
}

export function timeAgo(value: string | Date) {
  const s = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 60) return "hozirgina";
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`;
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} kun oldin`;
  return formatDate(value);
}

export function dueLabel(due: string | null) {
  if (!due) return { text: "Muddatsiz", tone: "mute" as const };
  const ms = new Date(due).getTime() - Date.now();
  if (ms < 0) return { text: "Muddati o'tgan", tone: "danger" as const };
  const h = ms / 3_600_000;
  if (h < 24) return { text: `${Math.max(1, Math.round(h))} soat qoldi`, tone: "warn" as const };
  return { text: `${Math.round(h / 24)} kun qoldi`, tone: "mute" as const };
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";

export const withArticle = (v: { article: string | null; de: string }) => (v.article ? `${v.article} ${v.de}` : v.de);

/** Tiny, safe markdown renderer for lesson notes (headings, lists, bold, italic). */
export function renderMarkdown(md: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/_(.+?)_/g, "<em>$1</em>");
  const out: string[] = [];
  let list: "ol" | "ul" | null = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (!line) { close(); continue; }
    if (line.startsWith("## ")) { close(); out.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    const ol = line.match(/^\d+\.\s+(.*)/);
    const ul = line.match(/^[-*]\s+(.*)/);
    if (ol || ul) {
      const kind = ol ? "ol" : "ul";
      if (list !== kind) { close(); out.push(`<${kind}>`); list = kind; }
      out.push(`<li>${inline((ol ?? ul)![1])}</li>`);
      continue;
    }
    close();
    out.push(`<p>${inline(line)}</p>`);
  }
  close();
  return out.join("");
}

/** Converts YouTube/Vimeo links to embeddable URLs. */
export function embedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
