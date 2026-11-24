# Temurlify

**Raqamli nemis tili sinfxonasi** — A1 dan C1 gacha 120 dars, test bilan avtomatik ochiladigan darslar, to'rt ko'nikma bo'yicha uy vazifalari, nemischa-o'zbekcha lug'at va AI tarjimon, kartochkalar, jonli o'yinlar va to'liq admin panel.

A German learning platform for Uzbek speakers. Next.js 16 · TypeScript · Tailwind CSS 4 · Supabase (Auth, Postgres, Storage, Realtime) · Vercel.

## Features

| Students | Admin / teachers |
|---|---|
| Dashboard with next lesson, daily XP goal, streak, homework and announcements | Overview: active students, grading queue, top and struggling students |
| 120-lesson curriculum (A1–C1), video, vocabulary file, lesson notes | Lesson editor: details, video upload or YouTube/Vimeo link, vocabulary file, test questions with answer keys, vocabulary |
| Lesson tests graded on the server; next lesson unlocks at **53%** (configurable globally and per lesson) | Manual lesson unlock per student |
| Homework: Lesen (text), Hören (audio), Sprechen (in-browser recording), Schreiben (word count) | Homework builder, submissions, scoring + feedback, "return for revision" |
| German–Uzbek dictionary, AI translator with grammar notes | Global dictionary editor with bulk import |
| Flashcards with spaced repetition (SM-2) | Announcements to everyone or a group (real-time notifications) |
| Live multiplayer games with a 6-digit Game ID and live leaderboard | Game sets, question editor, auto-generate from vocabulary, projector host screen |
| Progress analytics, group comparison, leaderboard, attendance | Attendance sheets, classroom randomizer and team splitter |
| Achievements, real-time notifications, light/dark theme | Students & groups, roles, blocking, password reset, platform settings |

## Security model

- All data access goes through Supabase **row level security**; the browser only holds the anon/publishable key.
- Test answer keys and game answers live in tables students cannot read. Grading, scoring, unlocking, XP and streaks happen in `security definer` Postgres functions.
- Students cannot change their role, group, XP or homework grades (guard triggers).
- `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are only read in server code (`server-only` modules).

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com) (region `eu-central-1` is closest to Uzbekistan).
2. Apply the migrations in `supabase/migrations/` in order (SQL editor, or `npx supabase link && npx supabase db push`). The 4th migration seeds the curriculum: 120 lessons, 840 words, 839 questions, 18 achievements and a sample game set.
3. **Auth → URL configuration**: set Site URL to your domain and add `https://YOUR-DOMAIN/auth/callback` to redirect URLs.
4. Optional: turn off "Confirm email" if students should be able to sign in right after registering.

### 2. Vercel
1. Import this GitHub repository in Vercel (framework: Next.js, no extra settings).
2. Add the environment variables from `.env.example` (Production + Preview).
3. Deploy. Every push to a branch creates a preview deployment; `main` deploys to production.
4. Add the domain `temurlify.uz` under Project → Domains.

### 3. First admin
Put your email in `ADMIN_EMAILS`, register on the site, and you are promoted to admin on first visit. Admins can then promote teachers from **Admin → Talabalar**.

## Local development

```bash
npm install
npx supabase start          # local Postgres/Auth/Storage/Realtime in Docker
cp .env.example .env.local  # fill with the keys printed by `supabase start`
npm run dev
```

Tests:

```bash
npm run test:db    # migrations + business-logic tests on a plain local Postgres
npm run test:e2e   # browser walkthrough of both roles (needs the app on :3000)
```

## Project structure

```
src/app/(auth)        login, register, password reset
src/app/(app)         student app (dashboard, learn, homework, dictionary, flashcards, games, progress…)
src/app/admin         admin panel
src/app/api/translate AI translator endpoint
src/components        UI kit, shells, charts, game parts
src/lib               Supabase clients, auth helpers, types, utils
supabase/migrations   schema, functions, RLS/storage/realtime, curriculum seed
scripts/              curriculum source + seed generator (`npm run db:seed`)
```

Curriculum content lives in `scripts/curriculum.mjs`; edit it and run `npm run db:seed` to regenerate the seed migration, or manage everything from the admin panel.
