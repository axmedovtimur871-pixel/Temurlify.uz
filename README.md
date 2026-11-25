# Temurlify

**Raqamli nemis tili sinfxonasi** — A1 dan C1 gacha 120 dars, test bilan avtomatik ochiladigan darslar, to'rt ko'nikma bo'yicha uy vazifalari, nemischa-o'zbekcha lug'at va AI tarjimon, kartochkalar, jonli o'yinlar va to'liq admin panel.

A German learning platform for Uzbek speakers. Next.js 16 · TypeScript · Tailwind CSS 4 · Supabase (Auth, Postgres, Storage, Realtime) · Cloudflare Workers (or Vercel).

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

### 2. Cloudflare Workers (recommended)
The app runs on Cloudflare Workers through the [OpenNext adapter](https://opennext.js.org/cloudflare) (`open-next.config.ts`, `wrangler.jsonc`). Cloudflare builds and deploys straight from GitHub, so no API token has to leave your account.

1. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → choose `Temurlify.uz`.
2. Settings:
   - Project name: `temurlify` (must match `name` in `wrangler.jsonc`)
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Production branch: `main` (other branches get preview URLs)
3. **Build variables** (inlined at build time): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
4. **Settings → Variables and Secrets** (runtime, type *Secret*): `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ADMIN_EMAILS`.
5. **Settings → Domains & Routes** → add `temurlify.uz`.

Before Supabase is configured the site still deploys and shows a setup page.

Deploying from your own computer instead: `npx wrangler login`, then `npm run cf:deploy` with the build variables in `.env.local` and secrets set via `npx wrangler secret put NAME`. Test the Worker locally with `npm run cf:preview`.

### 2b. Vercel (alternative)
Import the repository in Vercel, add the variables from `.env.example`, deploy. No extra configuration is needed.

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
