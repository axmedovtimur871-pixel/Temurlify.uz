import {
  Award, BookOpen, CalendarCheck, CalendarHeart, ClipboardCheck, Crown, Flag, Flame, Footprints, Gamepad2,
  Gem, Layers, Library, Medal, Mountain, Shield, Target, Trophy, Zap,
} from "lucide-react";

const MAP = {
  footprints: Footprints, "book-open": BookOpen, flag: Flag, mountain: Mountain, crown: Crown, zap: Zap, flame: Flame,
  gem: Gem, "calendar-check": CalendarCheck, "calendar-heart": CalendarHeart, shield: Shield, layers: Layers,
  library: Library, "clipboard-check": ClipboardCheck, "gamepad-2": Gamepad2, trophy: Trophy, target: Target, medal: Medal,
} as const;

export function AchievementIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name as keyof typeof MAP] ?? Award;
  return <Icon className={className} strokeWidth={1.7} />;
}
