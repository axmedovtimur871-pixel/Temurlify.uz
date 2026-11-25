import type { Level } from "@/lib/types";

export type StudentStats = {
  xp: number; streak: number; longest_streak: number; total_lessons: number; lessons_passed: number;
  avg_score: number; tests_taken: number; cards_total: number; cards_due: number; cards_mastered: number;
  homework_pending: number; homework_avg: number; attendance_rate: number; achievements: number;
  today_xp: number; daily_goal: number; group_rank: number | null; group_size: number;
  group_avg_xp: number; group_avg_score: number; group_avg_lessons: number;
  days: { day: string; xp: number; lessons: number; cards: number }[];
  levels: { level: Level; total: number; passed: number }[];
  recent_tests: { lesson: string; position: number; score: number; passed: boolean; created_at: string }[];
};
