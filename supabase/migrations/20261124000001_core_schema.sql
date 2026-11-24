-- Temurlify core schema
-- Roles: student, teacher, admin. Teachers and admins are "staff".

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'teacher', 'admin');
create type public.cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1');
create type public.skill as enum ('lesen', 'hoeren', 'sprechen', 'schreiben');
create type public.question_kind as enum ('single', 'multi', 'text');
create type public.submission_status as enum ('submitted', 'graded', 'returned');
create type public.attendance_status as enum ('present', 'late', 'absent', 'excused');
create type public.game_status as enum ('lobby', 'live', 'reveal', 'finished');

-- ---------------------------------------------------------------------------
-- Groups and profiles
-- ---------------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level public.cefr_level not null default 'A1',
  schedule text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  role public.user_role not null default 'student',
  group_id uuid references public.groups (id) on delete set null,
  avatar_url text,
  target_level public.cefr_level not null default 'B1',
  xp integer not null default 0,
  streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index profiles_group_idx on public.profiles (group_id);

-- Helper predicates (security definer so they can be used inside RLS policies
-- without recursing into profiles' own policies).
create or replace function public.is_staff(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and role in ('teacher', 'admin'));
$$;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.my_group()
returns uuid language sql stable security definer set search_path = public as $$
  select group_id from public.profiles where id = auth.uid();
$$;

-- Create a profile whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Students may edit their own name/avatar/target level but never their role,
-- group, XP or streak.
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Trusted server functions (record_activity) set this flag for their own writes.
  if coalesce(current_setting('temurlify.internal', true), '') = '1' then
    return new;
  end if;
  if auth.uid() is not null and not public.is_staff(auth.uid()) then
    new.role := old.role;
    new.group_id := old.group_id;
    new.xp := old.xp;
    new.streak := old.streak;
    new.longest_streak := old.longest_streak;
    new.last_active_on := old.last_active_on;
    new.is_active := old.is_active;
    new.email := old.email;
  end if;
  -- Only admins can hand out the admin role.
  if auth.uid() is not null and new.role <> old.role and not public.is_admin(auth.uid()) then
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('pass_score', '53'),
  ('platform_name', '"Temurlify"'),
  ('allow_signup', 'true'),
  ('translator_enabled', 'true'),
  ('daily_xp_goal', '50');

create or replace function public.setting_int(k text, fallback integer)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::integer from public.app_settings where key = k), fallback);
$$;

-- ---------------------------------------------------------------------------
-- Curriculum
-- ---------------------------------------------------------------------------
create table public.levels (
  code public.cefr_level primary key,
  title text not null,
  title_uz text not null,
  description text not null default '',
  position smallint not null
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  level public.cefr_level not null references public.levels (code),
  position integer not null unique,          -- 1..120 global order
  title text not null,                       -- German title
  title_uz text not null,                    -- Uzbek title
  grammar text not null default '',          -- grammar focus
  summary text not null default '',          -- Uzbek summary / notes (markdown)
  video_url text,                            -- external (YouTube/Vimeo) link
  video_path text,                           -- object in lesson-media bucket
  vocab_file_path text,                      -- PDF/XLSX in lesson-media bucket
  duration_min integer not null default 20,
  pass_score integer,                        -- null = use global setting
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_level_idx on public.lessons (level, position);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  kind public.question_kind not null default 'single',
  prompt text not null,
  options jsonb not null default '[]',       -- array of strings
  explanation text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index questions_lesson_idx on public.questions (lesson_id, position);

-- Answer keys live in a separate table that students can never read.
-- single: {"index": 2}, multi: {"indexes": [0,3]}, text: {"accepted": ["der Hund"]}
create table public.question_keys (
  question_id uuid primary key references public.questions (id) on delete cascade,
  answer jsonb not null
);

create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  best_score integer not null default 0,
  attempts integer not null default 0,
  video_watched boolean not null default false,
  passed boolean not null default false,
  manually_unlocked boolean not null default false,
  passed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  score integer not null,
  correct integer not null,
  total integer not null,
  passed boolean not null,
  answers jsonb not null default '{}',
  result jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index test_attempts_user_idx on public.test_attempts (user_id, created_at desc);

-- A lesson is open when: it is the first published lesson, the student passed
-- the previous published lesson, staff unlocked it, or it was already passed.
create or replace function public.lesson_is_unlocked(p_user uuid, p_lesson uuid)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  v_pos integer;
  v_prev uuid;
begin
  select position into v_pos from public.lessons where id = p_lesson and is_published;
  if v_pos is null then return false; end if;

  if exists (select 1 from public.lesson_progress
             where user_id = p_user and lesson_id = p_lesson and (passed or manually_unlocked)) then
    return true;
  end if;

  select id into v_prev from public.lessons
   where is_published and position < v_pos order by position desc limit 1;
  if v_prev is null then return true; end if;

  return exists (select 1 from public.lesson_progress
                 where user_id = p_user and lesson_id = v_prev and passed);
end;
$$;

-- All lessons with the caller's unlock status, used by the curriculum map.
create or replace function public.my_curriculum()
returns table (
  id uuid, level public.cefr_level, "position" integer, title text, title_uz text,
  grammar text, duration_min integer, has_video boolean, question_count integer,
  best_score integer, attempts integer, passed boolean, unlocked boolean
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_prev_passed boolean := true;   -- first lesson is always open
  r record;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  for r in
    select l.*, coalesce(p.best_score, 0) as bs, coalesce(p.attempts, 0) as att,
           coalesce(p.passed, false) as ps, coalesce(p.manually_unlocked, false) as mu,
           (select count(*) from public.questions q where q.lesson_id = l.id)::integer as qc
      from public.lessons l
      left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = v_uid
     where l.is_published
     order by l.position
  loop
    id := r.id; level := r.level; "position" := r.position; title := r.title;
    title_uz := r.title_uz; grammar := r.grammar; duration_min := r.duration_min;
    has_video := (r.video_url is not null or r.video_path is not null);
    question_count := r.qc; best_score := r.bs; attempts := r.att; passed := r.ps;
    unlocked := v_prev_passed or r.ps or r.mu or public.is_staff(v_uid);
    v_prev_passed := r.ps;
    return next;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Vocabulary, dictionary and spaced repetition
-- ---------------------------------------------------------------------------
create table public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons (id) on delete set null,
  level public.cefr_level not null default 'A1',
  de text not null,                 -- lemma without article
  article text check (article in ('der', 'die', 'das')),
  plural text,
  part_of_speech text not null default 'noun',
  uz text not null,
  ru text,
  example_de text,
  example_uz text,
  created_at timestamptz not null default now()
);
create index vocabulary_lesson_idx on public.vocabulary (lesson_id);
create index vocabulary_de_idx on public.vocabulary (lower(de));
create index vocabulary_uz_idx on public.vocabulary (lower(uz));

create table public.user_cards (
  user_id uuid not null references public.profiles (id) on delete cascade,
  vocab_id uuid not null references public.vocabulary (id) on delete cascade,
  ease numeric(4, 2) not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, vocab_id)
);
create index user_cards_due_idx on public.user_cards (user_id, due_at);

create table public.translations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  direction text not null check (direction in ('de-uz', 'uz-de')),
  source text not null,
  result text not null,
  created_at timestamptz not null default now()
);
create index translations_user_idx on public.translations (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Activity, XP, streaks
-- ---------------------------------------------------------------------------
create table public.daily_activity (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Tashkent')::date,
  xp integer not null default 0,
  lessons_passed integer not null default 0,
  tests_taken integer not null default 0,
  cards_reviewed integer not null default 0,
  homework_submitted integer not null default 0,
  games_played integer not null default 0,
  primary key (user_id, day)
);

-- Central place to record learning activity: adds XP and keeps the streak.
create or replace function public.record_activity(
  p_user uuid, p_xp integer, p_field text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'Asia/Tashkent')::date;
  v_last date;
  v_streak integer;
begin
  insert into public.daily_activity (user_id, day, xp) values (p_user, v_today, 0)
  on conflict (user_id, day) do nothing;

  update public.daily_activity set
    xp = xp + greatest(p_xp, 0),
    lessons_passed = lessons_passed + case when p_field = 'lessons_passed' then 1 else 0 end,
    tests_taken = tests_taken + case when p_field = 'tests_taken' then 1 else 0 end,
    cards_reviewed = cards_reviewed + case when p_field = 'cards_reviewed' then 1 else 0 end,
    homework_submitted = homework_submitted + case when p_field = 'homework_submitted' then 1 else 0 end,
    games_played = games_played + case when p_field = 'games_played' then 1 else 0 end
  where user_id = p_user and day = v_today;

  select last_active_on, streak into v_last, v_streak from public.profiles where id = p_user;
  if v_last is null or v_last < v_today - 1 then
    v_streak := 1;
  elsif v_last = v_today - 1 then
    v_streak := v_streak + 1;
  end if;

  perform set_config('temurlify.internal', '1', true);
  update public.profiles set
    xp = xp + greatest(p_xp, 0),
    streak = v_streak,
    longest_streak = greatest(longest_streak, v_streak),
    last_active_on = v_today
  where id = p_user;
  perform set_config('temurlify.internal', '', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Homework
-- ---------------------------------------------------------------------------
create table public.homework (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  skill public.skill not null,
  instructions text not null default '',
  reading_text text,                      -- Lesen: passage
  attachment_path text,                   -- Hören audio / any file in homework bucket
  lesson_id uuid references public.lessons (id) on delete set null,
  group_id uuid references public.groups (id) on delete cascade, -- null = everyone
  level public.cefr_level not null default 'A1',
  min_words integer,                      -- Schreiben
  max_points integer not null default 100,
  due_at timestamptz,
  is_published boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index homework_group_idx on public.homework (group_id, due_at);

create table public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references public.homework (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text_answer text,
  file_path text,                         -- Sprechen recording / uploaded file
  status public.submission_status not null default 'submitted',
  score integer,
  feedback text,
  graded_by uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz not null default now(),
  graded_at timestamptz,
  unique (homework_id, user_id)
);

-- Students may only touch the answer fields; grading fields are staff-only.
create or replace function public.guard_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then
    if tg_op = 'INSERT' then
      new.user_id := auth.uid();
      new.status := 'submitted';
      new.score := null; new.feedback := null; new.graded_by := null; new.graded_at := null;
      new.submitted_at := now();
    else
      if old.status = 'graded' then
        raise exception 'Baholangan vazifani o''zgartirib bo''lmaydi';
      end if;
      new.user_id := old.user_id; new.homework_id := old.homework_id;
      new.status := 'submitted';
      new.score := old.score; new.feedback := old.feedback;
      new.graded_by := old.graded_by; new.graded_at := old.graded_at;
      new.submitted_at := now();
    end if;
  else
    if new.status = 'graded' and (tg_op = 'INSERT' or old.status is distinct from 'graded') then
      new.graded_at := now();
      new.graded_by := auth.uid();
    end if;
  end if;
  return new;
end;
$$;

create trigger homework_submissions_guard before insert or update on public.homework_submissions
  for each row execute function public.guard_submission();

create or replace function public.after_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.record_activity(new.user_id, 15, 'homework_submitted');
  end if;
  return new;
end;
$$;

create trigger homework_submissions_after after insert on public.homework_submissions
  for each row execute function public.after_submission();

-- ---------------------------------------------------------------------------
-- Announcements and notifications
-- ---------------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  group_id uuid references public.groups (id) on delete cascade, -- null = everyone
  pinned boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'info',  -- info | announcement | homework | grade | achievement | lesson
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.notify_audience(
  p_group uuid, p_kind text, p_title text, p_body text, p_link text
) returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select id, p_kind, p_title, p_body, p_link from public.profiles
   where role = 'student' and is_active and (p_group is null or group_id = p_group);
$$;

create or replace function public.on_announcement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_audience(new.group_id, 'announcement', new.title, left(new.body, 240), '/notifications');
  return new;
end;
$$;
create trigger announcements_notify after insert on public.announcements
  for each row execute function public.on_announcement();

create or replace function public.on_homework()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_published and (tg_op = 'INSERT' or not old.is_published) then
    perform public.notify_audience(new.group_id, 'homework', 'Yangi uy vazifasi: ' || new.title,
      coalesce('Muddat: ' || to_char(new.due_at at time zone 'Asia/Tashkent', 'DD.MM.YYYY HH24:MI'), 'Muddatsiz'),
      '/homework/' || new.id);
  end if;
  return new;
end;
$$;
create trigger homework_notify after insert or update of is_published on public.homework
  for each row execute function public.on_homework();

create or replace function public.on_graded()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  if new.status in ('graded', 'returned') and old.status is distinct from new.status then
    select title into v_title from public.homework where id = new.homework_id;
    insert into public.notifications (user_id, kind, title, body, link)
    values (new.user_id, 'grade',
      case when new.status = 'graded' then 'Vazifa baholandi: ' || v_title
           else 'Vazifa qayta ishlashga qaytarildi: ' || v_title end,
      coalesce(new.score::text || ' ball. ', '') || coalesce(left(new.feedback, 200), ''),
      '/homework/' || new.homework_id);
  end if;
  return new;
end;
$$;
create trigger homework_submissions_graded after update on public.homework_submissions
  for each row execute function public.on_graded();

-- ---------------------------------------------------------------------------
-- Achievements
-- ---------------------------------------------------------------------------
create table public.achievements (
  code text primary key,
  title text not null,
  description text not null,
  icon text not null default 'award',
  metric text not null,     -- lessons_passed | xp | streak | cards_reviewed | homework | games | perfect_tests
  threshold integer not null,
  position integer not null default 0
);

create table public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  code text not null references public.achievements (code) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, code)
);

create or replace function public.check_achievements(p_user uuid)
returns setof text language plpgsql security definer set search_path = public as $$
declare
  a record;
  v_value integer;
begin
  for a in select * from public.achievements
            where code not in (select code from public.user_achievements where user_id = p_user)
  loop
    v_value := case a.metric
      when 'lessons_passed' then (select count(*) from public.lesson_progress where user_id = p_user and passed)
      when 'xp' then (select xp from public.profiles where id = p_user)
      when 'streak' then (select longest_streak from public.profiles where id = p_user)
      when 'cards_reviewed' then (select coalesce(sum(cards_reviewed), 0) from public.daily_activity where user_id = p_user)
      when 'homework' then (select count(*) from public.homework_submissions where user_id = p_user)
      when 'games' then (select count(*) from public.game_players where user_id = p_user)
      when 'perfect_tests' then (select count(*) from public.test_attempts where user_id = p_user and score = 100)
      else 0 end;
    if coalesce(v_value, 0) >= a.threshold then
      insert into public.user_achievements (user_id, code) values (p_user, a.code) on conflict do nothing;
      insert into public.notifications (user_id, kind, title, body, link)
      values (p_user, 'achievement', 'Yangi yutuq: ' || a.title, a.description, '/achievements');
      return next a.code;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Attendance
-- ---------------------------------------------------------------------------
create table public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  held_on date not null default (now() at time zone 'Asia/Tashkent')::date,
  topic text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (group_id, held_on)
);

create table public.attendance_records (
  session_id uuid not null references public.attendance_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.attendance_status not null default 'present',
  note text,
  primary key (session_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Multiplayer games
-- ---------------------------------------------------------------------------
create table public.game_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  level public.cefr_level not null default 'A1',
  seconds_per_question integer not null default 20 check (seconds_per_question between 5 and 120),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.game_questions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.game_sets (id) on delete cascade,
  prompt text not null,
  options jsonb not null,          -- array of 2..4 strings
  position integer not null default 0
);
create index game_questions_set_idx on public.game_questions (set_id, position);

create table public.game_question_keys (
  question_id uuid primary key references public.game_questions (id) on delete cascade,
  correct_index integer not null
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- 6-digit Game ID
  set_id uuid not null references public.game_sets (id) on delete cascade,
  host_id uuid not null references public.profiles (id) on delete cascade,
  status public.game_status not null default 'lobby',
  current_index integer not null default -1,
  question_count integer not null default 0,
  seconds_per_question integer not null default 20,
  question_started_at timestamptz,
  -- The current question is copied here (without the answer) so players can
  -- read it via realtime without access to the question bank.
  current_prompt text,
  current_options jsonb,
  last_correct_index integer,               -- revealed after each question
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  nickname text not null,
  score integer not null default 0,
  correct_count integer not null default 0,
  joined_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create table public.game_answers (
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  question_index integer not null,
  player_id uuid not null references public.game_players (id) on delete cascade,
  choice integer not null,
  is_correct boolean not null,
  points integer not null,
  answered_at timestamptz not null default now(),
  primary key (session_id, question_index, player_id)
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger lessons_touch before update on public.lessons
  for each row execute function public.touch_updated_at();
