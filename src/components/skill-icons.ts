import { BookOpenText, Headphones, Mic, PenLine } from "lucide-react";
import type { Skill } from "@/lib/types";

export const SKILL_ICONS: Record<Skill, typeof Mic> = { lesen: BookOpenText, hoeren: Headphones, sprechen: Mic, schreiben: PenLine };
