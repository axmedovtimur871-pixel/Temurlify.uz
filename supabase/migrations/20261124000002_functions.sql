-- Server-side business logic. Every function that changes scores, unlocks
-- lessons or reads answer keys runs here, never in the browser.

-- ---------------------------------------------------------------------------
-- Lesson tests
-- ---------------------------------------------------------------------------
create or replace function public.normalize_answer(t text)
returns text language sql immutable as $$
  select regexp_replace(regexp_replace(lower(trim(coalesce(t, ''))), '\s+', ' ', 'g'), '[\.\!\?,;:]+$', '');
$$;

create or replace function public.submit_lesson_test(p_lesson uuid, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_lesson public.lessons;
  v_pass integer;
  v_total integer := 0;
  v_correct integer := 0;
  v_score integer;
  v_passed boolean;
  v_was_passed boolean;
  v_ok boolean;
  v_given jsonb;
  v_results jsonb := '[]';
  v_next public.lessons;
  q record;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select * into v_lesson from public.lessons where id = p_lesson;
  if v_lesson.id is null then raise exception 'Dars topilmadi'; end if;
  if not public.lesson_is_unlocked(v_uid, p_lesson) and not public.is_staff(v_uid) then
    raise exception 'Bu dars hali qulflangan';
  end if;

  v_pass := coalesce(v_lesson.pass_score, public.setting_int('pass_score', 53));

  for q in
    select qs.id, qs.kind, qs.options, qs.explanation, k.answer
      from public.questions qs join public.question_keys k on k.question_id = qs.id
     where qs.lesson_id = p_lesson order by qs.position
  loop
    v_total := v_total + 1;
    v_given := p_answers -> q.id::text;
    v_ok := case q.kind
      when 'single' then v_given is not null and jsonb_typeof(v_given) = 'number'
                         and (v_given)::integer = (q.answer ->> 'index')::integer
      when 'multi' then v_given is not null and jsonb_typeof(v_given) = 'array' and
        (select coalesce(array_agg(x::integer order by x::integer), '{}') from jsonb_array_elements_text(v_given) x)
        = (select coalesce(array_agg(x::integer order by x::integer), '{}') from jsonb_array_elements_text(q.answer -> 'indexes') x)
      else exists (select 1 from jsonb_array_elements_text(q.answer -> 'accepted') a
                    where public.normalize_answer(a) = public.normalize_answer(v_given #>> '{}'))
    end;
    if v_ok then v_correct := v_correct + 1; end if;
    v_results := v_results || jsonb_build_object(
      'question_id', q.id, 'correct', coalesce(v_ok, false), 'explanation', q.explanation, 'key', q.answer);
  end loop;

  v_score := case when v_total = 0 then 100 else round(v_correct * 100.0 / v_total) end;
  v_passed := v_score >= v_pass;

  select coalesce(passed, false) into v_was_passed from public.lesson_progress
   where user_id = v_uid and lesson_id = p_lesson;
  v_was_passed := coalesce(v_was_passed, false);

  insert into public.lesson_progress (user_id, lesson_id, best_score, attempts, passed, passed_at)
  values (v_uid, p_lesson, v_score, 1, v_passed, case when v_passed then now() end)
  on conflict (user_id, lesson_id) do update set
    best_score = greatest(public.lesson_progress.best_score, excluded.best_score),
    attempts = public.lesson_progress.attempts + 1,
    passed = public.lesson_progress.passed or excluded.passed,
    passed_at = coalesce(public.lesson_progress.passed_at, excluded.passed_at),
    updated_at = now();

  -- Correct answers are only revealed once the student passes, so the test
  -- cannot be brute-forced by reading the key after a failed attempt.
  if not v_passed then
    v_results := (select coalesce(jsonb_agg(r - 'key'), '[]') from jsonb_array_elements(v_results) r);
  end if;

  insert into public.test_attempts (user_id, lesson_id, score, correct, total, passed, answers, result)
  values (v_uid, p_lesson, v_score, v_correct, v_total, v_passed, coalesce(p_answers, '{}'), v_results);

  perform public.record_activity(v_uid, 10 + case when v_score = 100 then 10 else 0 end, 'tests_taken');

  if v_passed and not v_was_passed then
    perform public.record_activity(v_uid, 40, 'lessons_passed');
    select * into v_next from public.lessons
     where is_published and position > v_lesson.position order by position limit 1;
    if v_next.id is not null then
      insert into public.notifications (user_id, kind, title, body, link)
      values (v_uid, 'lesson', 'Yangi dars ochildi: ' || v_next.title,
              v_next.position || '-dars endi siz uchun ochiq. Davom eting!', '/learn/' || v_next.id);
    end if;
  end if;

  perform public.check_achievements(v_uid);

  return jsonb_build_object(
    'score', v_score, 'correct', v_correct, 'total', v_total, 'passed', v_passed,
    'pass_score', v_pass, 'newly_passed', v_passed and not v_was_passed,
    'next_lesson', case when v_passed then v_next.id end,
    'results', v_results);
end;
$$;

create or replace function public.mark_video_watched(p_lesson uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.lesson_is_unlocked(auth.uid(), p_lesson) then raise exception 'Dars qulflangan'; end if;
  insert into public.lesson_progress (user_id, lesson_id, video_watched)
  values (auth.uid(), p_lesson, true)
  on conflict (user_id, lesson_id) do update set video_watched = true, updated_at = now();
end;
$$;

-- Staff override: open a lesson for a student without the test.
create or replace function public.staff_unlock_lesson(p_user uuid, p_lesson uuid, p_unlock boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  insert into public.lesson_progress (user_id, lesson_id, manually_unlocked)
  values (p_user, p_lesson, p_unlock)
  on conflict (user_id, lesson_id) do update set manually_unlocked = p_unlock, updated_at = now();
end;
$$;

-- Staff: read a question's key (for the editor).
create or replace function public.staff_question_keys(p_lesson uuid)
returns table (question_id uuid, answer jsonb) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  return query select k.question_id, k.answer from public.question_keys k
    join public.questions q on q.id = k.question_id where q.lesson_id = p_lesson;
end;
$$;

-- ---------------------------------------------------------------------------
-- Spaced repetition (SM-2)
-- ---------------------------------------------------------------------------
create or replace function public.add_cards_from_lesson(p_lesson uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if not public.lesson_is_unlocked(auth.uid(), p_lesson) then raise exception 'Dars qulflangan'; end if;
  insert into public.user_cards (user_id, vocab_id)
  select auth.uid(), v.id from public.vocabulary v where v.lesson_id = p_lesson
  on conflict do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.add_card(p_vocab uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.user_cards (user_id, vocab_id) values (auth.uid(), p_vocab) on conflict do nothing;
$$;

-- quality: 0 = forgot, 3 = hard, 4 = good, 5 = easy
create or replace function public.review_card(p_vocab uuid, p_quality integer)
returns public.user_cards language plpgsql security definer set search_path = public as $$
declare
  c public.user_cards;
  q integer := least(greatest(p_quality, 0), 5);
begin
  select * into c from public.user_cards where user_id = auth.uid() and vocab_id = p_vocab for update;
  if c.user_id is null then raise exception 'Kartochka topilmadi'; end if;

  if q < 3 then
    c.repetitions := 0;
    c.interval_days := 0;
    c.lapses := c.lapses + 1;
    c.due_at := now() + interval '10 minutes';
  else
    c.repetitions := c.repetitions + 1;
    c.interval_days := case
      when c.repetitions = 1 then 1
      when c.repetitions = 2 then case when q = 5 then 4 else 3 end
      else greatest(1, round(c.interval_days * c.ease * case when q = 5 then 1.3 else 1 end))::integer end;
    c.due_at := now() + make_interval(days => c.interval_days);
  end if;
  c.ease := greatest(1.3, c.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  c.last_reviewed_at := now();

  update public.user_cards set
    ease = c.ease, interval_days = c.interval_days, repetitions = c.repetitions,
    lapses = c.lapses, due_at = c.due_at, last_reviewed_at = c.last_reviewed_at
  where user_id = c.user_id and vocab_id = c.vocab_id;

  perform public.record_activity(auth.uid(), 2, 'cards_reviewed');
  return c;
end;
$$;

-- ---------------------------------------------------------------------------
-- Multiplayer games
-- ---------------------------------------------------------------------------
create or replace function public.create_game(p_set uuid)
returns public.game_sessions language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_set public.game_sets;
  v_count integer;
  s public.game_sessions;
begin
  if not public.is_staff() then raise exception 'Faqat o''qituvchi o''yin yarata oladi'; end if;
  select * into v_set from public.game_sets where id = p_set;
  if v_set.id is null then raise exception 'O''yin to''plami topilmadi'; end if;
  select count(*) into v_count from public.game_questions where set_id = p_set;
  if v_count = 0 then raise exception 'To''plamda savollar yo''q'; end if;
  loop
    v_code := lpad((floor(random() * 1000000))::integer::text, 6, '0');
    exit when not exists (select 1 from public.game_sessions where code = v_code and status <> 'finished');
  end loop;
  -- Free a code that belonged to an old finished game.
  update public.game_sessions set code = code || '-' || left(id::text, 8) where code = v_code;
  insert into public.game_sessions (code, set_id, host_id, question_count, seconds_per_question)
  values (v_code, p_set, auth.uid(), v_count, v_set.seconds_per_question)
  returning * into s;
  return s;
end;
$$;

create or replace function public.join_game(p_code text, p_nickname text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  s public.game_sessions;
  v_nick text := left(trim(coalesce(p_nickname, '')), 24);
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into s from public.game_sessions where code = trim(p_code);
  if s.id is null then raise exception 'Bunday Game ID topilmadi'; end if;
  if s.status = 'finished' then raise exception 'Bu o''yin tugagan'; end if;
  if v_nick = '' then
    select split_part(full_name, ' ', 1) into v_nick from public.profiles where id = auth.uid();
  end if;
  insert into public.game_players (session_id, user_id, nickname)
  values (s.id, auth.uid(), coalesce(nullif(v_nick, ''), 'O''yinchi'))
  on conflict (session_id, user_id) do update set nickname = excluded.nickname;
  return s.id;
end;
$$;

create or replace function public.game_next(p_session uuid)
returns public.game_sessions language plpgsql security definer set search_path = public as $$
declare
  s public.game_sessions;
  q public.game_questions;
begin
  select * into s from public.game_sessions where id = p_session for update;
  if s.id is null or s.host_id <> auth.uid() then raise exception 'forbidden'; end if;
  if s.status = 'finished' then return s; end if;

  if s.current_index + 1 >= s.question_count then
    update public.game_sessions set status = 'finished', finished_at = now(),
      current_prompt = null, current_options = null
     where id = p_session returning * into s;
    perform public.record_activity(p.user_id, least(100, greatest(5, p.score / 100)), 'games_played')
       from public.game_players p where p.session_id = p_session;
    perform public.check_achievements(p.user_id) from public.game_players p where p.session_id = p_session;
    return s;
  end if;

  select * into q from public.game_questions where set_id = s.set_id
   order by position, id offset s.current_index + 1 limit 1;

  update public.game_sessions set
    status = 'live', current_index = s.current_index + 1, question_started_at = now(),
    current_prompt = q.prompt, current_options = q.options, last_correct_index = null
  where id = p_session returning * into s;
  return s;
end;
$$;

create or replace function public.game_reveal(p_session uuid)
returns public.game_sessions language plpgsql security definer set search_path = public as $$
declare
  s public.game_sessions;
  v_correct integer;
begin
  select * into s from public.game_sessions where id = p_session for update;
  if s.id is null or s.host_id <> auth.uid() then raise exception 'forbidden'; end if;
  if s.status <> 'live' then return s; end if;
  select k.correct_index into v_correct from public.game_questions q
    join public.game_question_keys k on k.question_id = q.id
   where q.set_id = s.set_id order by q.position, q.id offset s.current_index limit 1;
  update public.game_sessions set status = 'reveal', last_correct_index = v_correct
   where id = p_session returning * into s;
  return s;
end;
$$;

create or replace function public.game_answer(p_session uuid, p_choice integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.game_sessions;
  v_player public.game_players;
  v_correct integer;
  v_elapsed numeric;
  v_ok boolean;
  v_points integer;
begin
  select * into s from public.game_sessions where id = p_session;
  if s.id is null or s.status <> 'live' then raise exception 'Savol yopiq'; end if;
  select * into v_player from public.game_players where session_id = p_session and user_id = auth.uid();
  if v_player.id is null then raise exception 'Siz bu o''yinda emassiz'; end if;

  v_elapsed := extract(epoch from now() - s.question_started_at);
  if v_elapsed > s.seconds_per_question + 1.5 then raise exception 'Vaqt tugadi'; end if;

  select k.correct_index into v_correct from public.game_questions q
    join public.game_question_keys k on k.question_id = q.id
   where q.set_id = s.set_id order by q.position, q.id offset s.current_index limit 1;

  v_ok := p_choice = v_correct;
  v_points := case when v_ok then
    500 + round(500 * greatest(0, 1 - v_elapsed / s.seconds_per_question))::integer else 0 end;

  insert into public.game_answers (session_id, question_index, player_id, choice, is_correct, points)
  values (p_session, s.current_index, v_player.id, p_choice, v_ok, v_points);

  update public.game_players set score = score + v_points,
    correct_count = correct_count + case when v_ok then 1 else 0 end
  where id = v_player.id;

  return jsonb_build_object('accepted', true);
exception when unique_violation then
  raise exception 'Siz allaqachon javob berdingiz';
end;
$$;

-- Answer distribution for the current question (host screen) and the
-- caller's own result (player screen, only after reveal).
create or replace function public.game_round_stats(p_session uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  s public.game_sessions;
  v_counts jsonb;
  v_mine jsonb;
begin
  select * into s from public.game_sessions where id = p_session;
  if s.id is null then raise exception 'not found'; end if;
  select coalesce(jsonb_object_agg(choice, n), '{}') into v_counts from (
    select choice, count(*) n from public.game_answers
     where session_id = p_session and question_index = s.current_index group by choice) t;
  select to_jsonb(a) - 'session_id' - 'player_id' into v_mine from public.game_answers a
    join public.game_players p on p.id = a.player_id
   where a.session_id = p_session and a.question_index = s.current_index and p.user_id = auth.uid();
  return jsonb_build_object(
    'counts', case when s.host_id = auth.uid() or s.status <> 'live' then v_counts else '{}'::jsonb end,
    'answered', (select count(*) from public.game_answers where session_id = p_session and question_index = s.current_index),
    'mine', case when s.status = 'live' then (case when v_mine is null then null else jsonb_build_object('answered', true) end) else v_mine end);
end;
$$;

-- ---------------------------------------------------------------------------
-- Analytics
-- ---------------------------------------------------------------------------
create or replace function public.student_stats(p_user uuid default auth.uid())
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_group uuid;
  v_total_lessons integer;
  r jsonb;
begin
  if p_user <> auth.uid() and not public.is_staff() then raise exception 'forbidden'; end if;
  select group_id into v_group from public.profiles where id = p_user;
  select count(*) into v_total_lessons from public.lessons where is_published;

  select jsonb_build_object(
    'xp', p.xp, 'streak', p.streak, 'longest_streak', p.longest_streak,
    'total_lessons', v_total_lessons,
    'lessons_passed', (select count(*) from public.lesson_progress where user_id = p_user and passed),
    'avg_score', (select coalesce(round(avg(score)), 0) from public.test_attempts where user_id = p_user),
    'tests_taken', (select count(*) from public.test_attempts where user_id = p_user),
    'cards_total', (select count(*) from public.user_cards where user_id = p_user),
    'cards_due', (select count(*) from public.user_cards where user_id = p_user and due_at <= now()),
    'cards_mastered', (select count(*) from public.user_cards where user_id = p_user and interval_days >= 21),
    'homework_pending', (select count(*) from public.homework h
        where h.is_published and (h.group_id is null or h.group_id = v_group)
          and not exists (select 1 from public.homework_submissions s where s.homework_id = h.id and s.user_id = p_user)),
    'homework_avg', (select coalesce(round(avg(s.score * 100.0 / nullif(h.max_points, 0))), 0)
        from public.homework_submissions s join public.homework h on h.id = s.homework_id
        where s.user_id = p_user and s.status = 'graded'),
    'attendance_rate', (select coalesce(round(100.0 * count(*) filter (where status in ('present', 'late')) / nullif(count(*), 0)), 0)
        from public.attendance_records where user_id = p_user),
    'achievements', (select count(*) from public.user_achievements where user_id = p_user),
    'today_xp', (select coalesce(xp, 0) from public.daily_activity where user_id = p_user and day = (now() at time zone 'Asia/Tashkent')::date),
    'daily_goal', public.setting_int('daily_xp_goal', 50),
    'group_rank', (select rnk from (select id, rank() over (order by xp desc) rnk from public.profiles
        where role = 'student' and v_group is not null and group_id = v_group) t where id = p_user),
    'group_size', (select count(*) from public.profiles where role = 'student' and v_group is not null and group_id = v_group),
    'group_avg_xp', (select coalesce(round(avg(xp)), 0) from public.profiles where role = 'student' and v_group is not null and group_id = v_group),
    'group_avg_score', (select coalesce(round(avg(t.score)), 0) from public.test_attempts t join public.profiles pp on pp.id = t.user_id
        where v_group is not null and pp.group_id = v_group),
    'group_avg_lessons', (select coalesce(round(avg(c), 1), 0) from (select count(*) filter (where lp.passed) c from public.profiles pp
        left join public.lesson_progress lp on lp.user_id = pp.id where pp.role = 'student' and v_group is not null and pp.group_id = v_group group by pp.id) t),
    'days', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'xp', coalesce(a.xp, 0),
        'lessons', coalesce(a.lessons_passed, 0), 'cards', coalesce(a.cards_reviewed, 0)) order by d), '[]')
        from generate_series((now() at time zone 'Asia/Tashkent')::date - 27, (now() at time zone 'Asia/Tashkent')::date, interval '1 day') d
        left join public.daily_activity a on a.user_id = p_user and a.day = d::date),
    'levels', (select coalesce(jsonb_agg(jsonb_build_object('level', l.code, 'total', t.total, 'passed', t.passed) order by l.position), '[]')
        from public.levels l cross join lateral (
          select count(*) total, count(*) filter (where lp.passed) passed from public.lessons ls
          left join public.lesson_progress lp on lp.lesson_id = ls.id and lp.user_id = p_user
          where ls.level = l.code and ls.is_published) t),
    'recent_tests', (select coalesce(jsonb_agg(x order by x->>'created_at' desc), '[]') from (
        select jsonb_build_object('lesson', l.title, 'position', l.position, 'score', t.score, 'passed', t.passed, 'created_at', t.created_at) x
          from public.test_attempts t join public.lessons l on l.id = t.lesson_id
         where t.user_id = p_user order by t.created_at desc limit 8) z)
  ) into r
  from public.profiles p where p.id = p_user;
  return r;
end;
$$;

create or replace function public.leaderboard(p_scope text default 'group', p_period text default 'week')
returns table (user_id uuid, full_name text, avatar_url text, group_name text, xp bigint, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
declare v_group uuid := public.my_group();
begin
  return query
  select p.id, p.full_name, p.avatar_url, g.name,
    case when p_period = 'all' then p.xp::bigint
      else coalesce((select sum(a.xp) from public.daily_activity a where a.user_id = p.id
        and a.day > (now() at time zone 'Asia/Tashkent')::date - case when p_period = 'month' then 30 else 7 end), 0)::bigint end as score,
    p.id = auth.uid()
  from public.profiles p left join public.groups g on g.id = p.group_id
  where p.role = 'student' and p.is_active
    and (p_scope = 'all' or (v_group is not null and p.group_id = v_group) or (v_group is null and p.id = auth.uid()))
  order by score desc, p.full_name
  limit 50;
end;
$$;

create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Asia/Tashkent')::date;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'active_today', (select count(*) from public.daily_activity where day = v_today),
    'active_week', (select count(distinct user_id) from public.daily_activity where day > v_today - 7),
    'groups', (select count(*) from public.groups),
    'lessons', (select count(*) from public.lessons),
    'lessons_with_video', (select count(*) from public.lessons where video_url is not null or video_path is not null),
    'questions', (select count(*) from public.questions),
    'vocabulary', (select count(*) from public.vocabulary),
    'to_grade', (select count(*) from public.homework_submissions where status = 'submitted'),
    'tests_week', (select count(*) from public.test_attempts where created_at > now() - interval '7 days'),
    'avg_score_week', (select coalesce(round(avg(score)), 0) from public.test_attempts where created_at > now() - interval '7 days'),
    'days', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date,
        'active', (select count(*) from public.daily_activity a where a.day = d::date),
        'xp', (select coalesce(sum(xp), 0) from public.daily_activity a where a.day = d::date)) order by d), '[]')
        from generate_series(v_today - 13, v_today, interval '1 day') d),
    'top', (select coalesce(jsonb_agg(t), '[]') from (select id, full_name, xp, streak from public.profiles
        where role = 'student' order by xp desc limit 5) t),
    'struggling', (select coalesce(jsonb_agg(t), '[]') from (
        select p.id, p.full_name, round(avg(a.score)) avg_score, count(*) attempts
          from public.test_attempts a join public.profiles p on p.id = a.user_id
         where a.created_at > now() - interval '30 days'
         group by p.id, p.full_name having avg(a.score) < 60 order by avg(a.score) limit 5) t)
  );
end;
$$;
