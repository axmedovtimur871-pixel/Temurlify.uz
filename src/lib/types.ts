export type Role = "student" | "teacher" | "admin";
export type Level = "A1" | "A2" | "B1" | "B2" | "C1";
export type Skill = "lesen" | "hoeren" | "sprechen" | "schreiben";

export const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1"];

export type Profile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  group_id: string | null;
  avatar_url: string | null;
  target_level: Level;
  xp: number;
  streak: number;
  longest_streak: number;
  last_active_on: string | null;
  is_active: boolean;
  created_at: string;
};

export type Lesson = {
  id: string;
  level: Level;
  position: number;
  title: string;
  title_uz: string;
  grammar: string;
  summary: string;
  video_url: string | null;
  video_path: string | null;
  vocab_file_path: string | null;
  duration_min: number;
  pass_score: number | null;
  is_published: boolean;
};

export type CurriculumRow = {
  id: string;
  level: Level;
  position: number;
  title: string;
  title_uz: string;
  grammar: string;
  duration_min: number;
  has_video: boolean;
  question_count: number;
  best_score: number;
  attempts: number;
  passed: boolean;
  unlocked: boolean;
};

export type Question = {
  id: string;
  lesson_id: string;
  kind: "single" | "multi" | "text";
  prompt: string;
  options: string[];
  explanation: string | null;
  position: number;
};

export type Vocab = {
  id: string;
  lesson_id: string | null;
  level: Level;
  de: string;
  article: "der" | "die" | "das" | null;
  plural: string | null;
  part_of_speech: string;
  uz: string;
  ru: string | null;
  example_de: string | null;
  example_uz: string | null;
};

export type Homework = {
  id: string;
  title: string;
  skill: Skill;
  instructions: string;
  reading_text: string | null;
  attachment_path: string | null;
  lesson_id: string | null;
  group_id: string | null;
  level: Level;
  min_words: number | null;
  max_points: number;
  due_at: string | null;
  is_published: boolean;
  created_at: string;
};

export type Submission = {
  id: string;
  homework_id: string;
  user_id: string;
  text_answer: string | null;
  file_path: string | null;
  status: "submitted" | "graded" | "returned";
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
};

export type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type GameSession = {
  id: string;
  code: string;
  set_id: string;
  host_id: string;
  status: "lobby" | "live" | "reveal" | "finished";
  current_index: number;
  question_count: number;
  seconds_per_question: number;
  question_started_at: string | null;
  current_prompt: string | null;
  current_options: string[] | null;
  last_correct_index: number | null;
};

export type GamePlayer = {
  id: string;
  session_id: string;
  user_id: string;
  nickname: string;
  score: number;
  correct_count: number;
};
