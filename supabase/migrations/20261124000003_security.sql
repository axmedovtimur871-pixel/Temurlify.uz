-- Row level security, grants, storage buckets and realtime.

alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.levels enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.question_keys enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.test_attempts enable row level security;
alter table public.vocabulary enable row level security;
alter table public.user_cards enable row level security;
alter table public.translations enable row level security;
alter table public.daily_activity enable row level security;
alter table public.homework enable row level security;
alter table public.homework_submissions enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.game_sets enable row level security;
alter table public.game_questions enable row level security;
alter table public.game_question_keys enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_players enable row level security;
alter table public.game_answers enable row level security;

-- groups
create policy "groups readable by members" on public.groups for select to authenticated
  using (public.is_staff() or id = public.my_group());
create policy "groups managed by staff" on public.groups for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- profiles: everyone sees classmates (needed for leaderboards); staff see all.
create policy "profiles readable" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff() or (group_id is not null and group_id = public.my_group()));
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_staff()) with check (id = auth.uid() or public.is_staff());
create policy "profiles admin delete" on public.profiles for delete to authenticated
  using (public.is_admin());

-- settings: readable by all signed-in users, editable by admins.
create policy "settings readable" on public.app_settings for select to authenticated using (true);
create policy "settings admin" on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- curriculum
create policy "levels readable" on public.levels for select to anon, authenticated using (true);
create policy "levels staff" on public.levels for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "lessons readable" on public.lessons for select to authenticated
  using (is_published or public.is_staff());
create policy "lessons staff" on public.lessons for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Questions are visible only for lessons the student has unlocked.
create policy "questions for unlocked lessons" on public.questions for select to authenticated
  using (public.is_staff() or public.lesson_is_unlocked(auth.uid(), lesson_id));
create policy "questions staff" on public.questions for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "question keys staff only" on public.question_keys for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "progress own" on public.lesson_progress for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy "progress staff write" on public.lesson_progress for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "attempts own" on public.test_attempts for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- vocabulary is the public dictionary
create policy "vocabulary readable" on public.vocabulary for select to authenticated using (true);
create policy "vocabulary staff" on public.vocabulary for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "cards own read" on public.user_cards for select to authenticated using (user_id = auth.uid());
create policy "cards own delete" on public.user_cards for delete to authenticated using (user_id = auth.uid());

create policy "translations own" on public.translations for select to authenticated using (user_id = auth.uid());
create policy "translations own insert" on public.translations for insert to authenticated with check (user_id = auth.uid());
create policy "translations own delete" on public.translations for delete to authenticated using (user_id = auth.uid());

create policy "activity own" on public.daily_activity for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- homework
create policy "homework visible to audience" on public.homework for select to authenticated
  using (public.is_staff() or (is_published and (group_id is null or group_id = public.my_group())));
create policy "homework staff" on public.homework for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "submissions own or staff" on public.homework_submissions for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy "submissions insert own" on public.homework_submissions for insert to authenticated
  with check (public.is_staff() or (user_id = auth.uid() and exists (
    select 1 from public.homework h where h.id = homework_id and h.is_published
      and (h.group_id is null or h.group_id = public.my_group()))));
create policy "submissions update own or staff" on public.homework_submissions for update to authenticated
  using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
create policy "submissions staff delete" on public.homework_submissions for delete to authenticated
  using (public.is_staff());

-- announcements & notifications
create policy "announcements audience" on public.announcements for select to authenticated
  using (public.is_staff() or group_id is null or group_id = public.my_group());
create policy "announcements staff" on public.announcements for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "notifications own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications mark read" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications delete own" on public.notifications for delete to authenticated using (user_id = auth.uid());
create policy "notifications staff insert" on public.notifications for insert to authenticated
  with check (public.is_staff());

-- achievements
create policy "achievements readable" on public.achievements for select to authenticated using (true);
create policy "achievements admin" on public.achievements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "user achievements readable" on public.user_achievements for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- attendance
create policy "attendance sessions read" on public.attendance_sessions for select to authenticated
  using (public.is_staff() or group_id = public.my_group());
create policy "attendance sessions staff" on public.attendance_sessions for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "attendance records read" on public.attendance_records for select to authenticated
  using (public.is_staff() or user_id = auth.uid());
create policy "attendance records staff" on public.attendance_records for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- games: question bank is staff only; sessions/players are readable by participants.
create policy "game sets readable" on public.game_sets for select to authenticated using (true);
create policy "game sets staff" on public.game_sets for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "game questions staff" on public.game_questions for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
create policy "game keys staff" on public.game_question_keys for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create or replace function public.in_game(p_session uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.game_players where session_id = p_session and user_id = auth.uid())
      or exists (select 1 from public.game_sessions where id = p_session and host_id = auth.uid());
$$;

create policy "game sessions participants" on public.game_sessions for select to authenticated
  using (public.is_staff() or public.in_game(id));
create policy "game sessions host delete" on public.game_sessions for delete to authenticated
  using (host_id = auth.uid() or public.is_admin());
create policy "game players participants" on public.game_players for select to authenticated
  using (public.is_staff() or public.in_game(session_id));
create policy "game players leave" on public.game_players for delete to authenticated
  using (user_id = auth.uid() or public.is_staff());
create policy "game answers own or host" on public.game_answers for select to authenticated
  using (public.is_staff() or exists (select 1 from public.game_players p where p.id = player_id and p.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Function privileges: internal helpers are not callable from the API.
-- ---------------------------------------------------------------------------
revoke execute on function public.record_activity(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.notify_audience(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.check_achievements(uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.lesson_is_unlocked(uuid, uuid) from anon;
grant execute on function public.lesson_is_unlocked(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('lesson-media', 'lesson-media', false, 524288000),   -- videos, vocabulary files (500 MB)
  ('homework', 'homework', false, 52428800),            -- assignments and submissions (50 MB)
  ('avatars', 'avatars', true, 2097152)
on conflict (id) do nothing;

create policy "lesson media read" on storage.objects for select to authenticated
  using (bucket_id = 'lesson-media');
create policy "lesson media staff write" on storage.objects for insert to authenticated
  with check (bucket_id = 'lesson-media' and public.is_staff());
create policy "lesson media staff update" on storage.objects for update to authenticated
  using (bucket_id = 'lesson-media' and public.is_staff());
create policy "lesson media staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'lesson-media' and public.is_staff());

-- homework/assignments/* : staff uploads, everyone signed in reads
-- homework/submissions/{uid}/* : the student and staff
create policy "homework files read" on storage.objects for select to authenticated
  using (bucket_id = 'homework' and (
    public.is_staff()
    or (storage.foldername(name))[1] = 'assignments'
    or ((storage.foldername(name))[1] = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text)));
create policy "homework files write" on storage.objects for insert to authenticated
  with check (bucket_id = 'homework' and (
    public.is_staff()
    or ((storage.foldername(name))[1] = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text)));
create policy "homework files update" on storage.objects for update to authenticated
  using (bucket_id = 'homework' and (
    public.is_staff()
    or ((storage.foldername(name))[1] = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text)));
create policy "homework files delete" on storage.objects for delete to authenticated
  using (bucket_id = 'homework' and (
    public.is_staff()
    or ((storage.foldername(name))[1] = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text)));

create policy "avatars read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars own write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.game_players;
alter table public.game_sessions replica identity full;
alter table public.game_players replica identity full;
