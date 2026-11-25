-- Behaviour tests run against a local Postgres with local-shim.sql.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a', 'admin@test.uz', '{"full_name":"Admin"}'),
 ('00000000-0000-0000-0000-00000000000b', 'ali@test.uz', '{"full_name":"Ali Valiyev"}'),
 ('00000000-0000-0000-0000-00000000000c', 'vali@test.uz', '{"full_name":"Vali"}');
update public.profiles set role = 'admin' where email = 'admin@test.uz';
insert into public.groups (id, name) values ('00000000-0000-0000-0000-0000000000f1', 'A1-1');
update public.profiles set group_id = '00000000-0000-0000-0000-0000000000f1' where role = 'student';

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on storage.objects to authenticated;
set role authenticated;

-- === Student Ali ===
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);

-- Student cannot escalate role or XP
update public.profiles set role = 'admin', xp = 9999 where id = auth.uid();
do $$ begin assert (select role from public.profiles where id = auth.uid()) = 'student', 'role escalation'; 
               assert (select xp from public.profiles where id = auth.uid()) = 0, 'xp escalation'; end $$;

-- Answer keys are invisible
do $$ begin assert (select count(*) from public.question_keys) = 0, 'keys visible to student'; end $$;

-- Only lesson 1 open; lesson 2 questions hidden
do $$ begin
  assert (select unlocked from public.my_curriculum() where position = 1), 'lesson1 locked';
  assert not (select unlocked from public.my_curriculum() where position = 2), 'lesson2 open';
  assert (select count(*) from public.questions q join public.lessons l on l.id = q.lesson_id where l.position = 2) = 0, 'lesson2 questions visible';
end $$;

-- Locked lesson test is refused
do $$ begin
  perform public.submit_lesson_test((select id from public.lessons where position = 2), '{}');
  raise exception 'should fail';
exception when others then
  assert sqlerrm like '%qulflangan%', sqlerrm;
end $$;

-- Fail lesson 1 with empty answers: no unlock, keys not revealed
do $$ declare r jsonb; begin
  r := public.submit_lesson_test((select id from public.lessons where position = 1), '{}');
  assert (r->>'passed')::boolean = false, 'empty should fail';
  assert not (r->'results'->0 ? 'key'), 'key leaked on fail';
  assert not (select unlocked from public.my_curriculum() where position = 2), 'unlocked after fail';
end $$;
reset role;

-- Build a perfect answer sheet as superuser (simulating a student who knows the answers)
create temp table sheet as
select jsonb_object_agg(q.id::text, case q.kind when 'single' then k.answer->'index' when 'text' then to_jsonb(upper(k.answer->'accepted'->>0) || '.') end) a
from public.questions q join public.question_keys k on k.question_id = q.id join public.lessons l on l.id = q.lesson_id where l.position = 1;
-- And a sheet with exactly 4/7 correct (57% >= 53%)
create temp table sheet57 as
select jsonb_object_agg(id, a) a from (
  select q.id::text id, case q.kind when 'single' then k.answer->'index' else to_jsonb(k.answer->'accepted'->>0) end a
  from public.questions q join public.question_keys k on k.question_id = q.id join public.lessons l on l.id = q.lesson_id
  where l.position = 1 order by q.position limit 4) t;
grant select on sheet, sheet57 to authenticated;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);

do $$ declare r jsonb; begin
  r := public.submit_lesson_test((select id from public.lessons where position = 1), (select a from sheet57));
  assert (r->>'score')::int = 57, 'score ' || (r->>'score');
  assert (r->>'passed')::boolean, '57 should pass with 53 threshold';
  assert (select unlocked from public.my_curriculum() where position = 2), 'lesson2 not unlocked';
  assert not (select unlocked from public.my_curriculum() where position = 3), 'lesson3 open too early';
  r := public.submit_lesson_test((select id from public.lessons where position = 1), (select a from sheet));
  assert (r->>'score')::int = 100, 'normalized text answer failed: ' || r::text;
  assert (select xp from public.profiles where id = auth.uid()) = 10 + 50 + 20, 'xp ' || (select xp from public.profiles where id = auth.uid());
  assert (select streak from public.profiles where id = auth.uid()) = 1, 'streak';
  assert exists (select 1 from public.notifications where kind = 'lesson'), 'unlock notification';
  assert exists (select 1 from public.user_achievements where code = 'first_lesson'), 'achievement first_lesson';
  assert exists (select 1 from public.user_achievements where code = 'perfect_1'), 'achievement perfect';
end $$;

-- SRS
do $$ declare n int; c public.user_cards; begin
  n := public.add_cards_from_lesson((select id from public.lessons where position = 1));
  assert n = 7, 'cards ' || n;
  c := public.review_card((select vocab_id from public.user_cards limit 1), 5);
  assert c.interval_days = 1 and c.repetitions = 1, 'sm2 first';
  assert (public.student_stats()->>'cards_total')::int = 7, 'stats';
end $$;
reset role;

-- === Admin: homework, announcement, game ===
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
insert into public.homework (id, title, skill, instructions, max_points) values
 ('00000000-0000-0000-0000-0000000000e1', 'Schreiben 1', 'schreiben', 'Write', 10);
insert into public.announcements (title, body) values ('Ertaga dars yo''q', 'Bayram');
do $$ declare s public.game_sessions; begin
  s := public.create_game((select id from public.game_sets limit 1));
  assert length(s.code) = 6, 'code';
  perform set_config('test.game', s.id::text, false);
  perform set_config('test.code', s.code, false);
end $$;
reset role;

-- === Student Ali: homework + game ===
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
do $$ begin
  assert (select count(*) from public.notifications where kind in ('homework', 'announcement')) = 2, 'audience notifications';
end $$;
insert into public.homework_submissions (homework_id, user_id, text_answer, score, status)
values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000000c', 'Hallo', 10, 'graded');
do $$ begin
  assert (select user_id from public.homework_submissions) = '00000000-0000-0000-0000-00000000000b', 'user spoof';
  assert (select score from public.homework_submissions) is null, 'self grading';
  assert (select status from public.homework_submissions) = 'submitted', 'status spoof';
end $$;
do $$ declare sid uuid; begin
  sid := public.join_game(current_setting('test.code'), 'Ali');
  assert sid::text = current_setting('test.game'), 'join';
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
update public.homework_submissions set score = 8, feedback = 'Gut', status = 'graded';
do $$ declare s public.game_sessions; begin
  s := public.game_next(current_setting('test.game')::uuid);
  assert s.status = 'live' and s.current_index = 0 and s.current_prompt is not null, 'next';
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
do $$ begin
  assert (select count(*) from public.notifications where kind = 'grade') = 1, 'grade notification';
  assert (select count(*) from public.game_questions) = 0, 'game bank visible';
  assert (select current_prompt from public.game_sessions) is not null, 'session visible to player';
end $$;
reset role;
-- Superuser answers correctly on behalf of Ali
create temp table gk as select k.correct_index c from public.game_questions q join public.game_question_keys k on k.question_id = q.id
  order by q.position, q.id limit 1;
grant select on gk to authenticated;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
do $$ begin
  perform public.game_answer(current_setting('test.game')::uuid, (select c from gk));
  assert (select score from public.game_players where user_id = auth.uid()) >= 500, 'points';
  begin
    perform public.game_answer(current_setting('test.game')::uuid, 0);
    raise exception 'double answer allowed';
  exception when others then assert sqlerrm like '%allaqachon%', sqlerrm; end;
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
do $$ declare s public.game_sessions; i int; begin
  s := public.game_reveal(current_setting('test.game')::uuid);
  assert s.last_correct_index = (select c from gk), 'reveal';
  for i in 1..12 loop s := public.game_next(current_setting('test.game')::uuid); end loop;
  assert s.status = 'finished', 'finished ' || s.status;
  assert (public.admin_overview()->>'students')::int = 2, 'overview';
end $$;
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', true);
do $$ begin
  assert (select count(*) from public.homework_submissions) = 0, 'saw other submission';
  assert (select count(*) from public.leaderboard('group', 'week')) = 2, 'leaderboard';
  assert (select full_name from public.leaderboard('group', 'week') limit 1) = 'Ali Valiyev', 'leader';
end $$;
reset role;
rollback;
select 'ALL DATABASE FLOW TESTS PASSED' as result;
