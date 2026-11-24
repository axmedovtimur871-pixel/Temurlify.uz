import {
  Award, BookOpen, ClipboardList, Gamepad2, Languages, Layers, LayoutDashboard, LineChart,
  Users, Megaphone, BookText, Settings, Shuffle, CalendarCheck, FileAudio, UsersRound, Library,
} from "lucide-react";

export const STUDENT_NAV = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/learn", label: "Darslar", icon: BookOpen },
  { href: "/homework", label: "Uy vazifalari", icon: ClipboardList },
  { href: "/dictionary", label: "Lug'at va tarjimon", icon: Languages },
  { href: "/flashcards", label: "Kartochkalar", icon: Layers },
  { href: "/games", label: "O'yinlar", icon: Gamepad2 },
  { href: "/progress", label: "Natijalarim", icon: LineChart },
  { href: "/achievements", label: "Yutuqlar", icon: Award },
];

export const STUDENT_MOBILE = ["/dashboard", "/learn", "/homework", "/dictionary"];

export const ADMIN_NAV = [
  { group: "Umumiy", items: [
    { href: "/admin", label: "Boshqaruv paneli", icon: LayoutDashboard },
    { href: "/admin/students", label: "Talabalar", icon: Users },
    { href: "/admin/groups", label: "Guruhlar", icon: UsersRound },
    { href: "/admin/attendance", label: "Davomat", icon: CalendarCheck },
  ] },
  { group: "Ta'lim", items: [
    { href: "/admin/lessons", label: "Darslar va testlar", icon: BookText },
    { href: "/admin/vocabulary", label: "Lug'at", icon: Library },
    { href: "/admin/homework", label: "Uy vazifalari", icon: FileAudio },
  ] },
  { group: "Sinfxona", items: [
    { href: "/admin/announcements", label: "E'lonlar", icon: Megaphone },
    { href: "/admin/games", label: "O'yinlar", icon: Gamepad2 },
    { href: "/admin/randomizer", label: "Randomayzer", icon: Shuffle },
  ] },
  { group: "Tizim", items: [
    { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
  ] },
];
