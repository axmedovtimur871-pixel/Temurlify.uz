// Usage: start local Supabase (npx supabase start), run the app on :3000 with .env.local,
// then: SR=<service_role_key> node tests/e2e.mjs ./test-results
// Resets are not automatic — run `npx supabase db reset` before each run.
// End-to-end walkthrough of Temurlify against a local Supabase stack.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const SR = process.env.SR;
const API = "http://127.0.0.1:54321";
const results = [];
const errors = [];

const ok = (name, cond, extra = "") => { results.push(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`); };
async function rest(path, init = {}) {
  const r = await fetch(`${API}/rest/v1/${path}`, { ...init, headers: { apikey: SR, authorization: `Bearer ${SR}`, "content-type": "application/json", ...(init.headers || {}) } });
  return r.json();
}

const browser = await chromium.launch();
const mk = async (opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`pageerror ${page.url()}: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console ${page.url()}: ${m.text().slice(0, 200)}`); });
  return { ctx, page };
};
const shot = (page, name, full = true) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });

try {
  // ---------- Landing ----------
  const { page: pub } = await mk();
  await pub.goto(BASE);
  await shot(pub, "01-landing");
  ok("landing renders", await pub.getByRole("heading", { name: /bir tizimda/ }).isVisible());
  await pub.goto(`${BASE}/dashboard`);
  ok("signed-out redirect to login", pub.url().includes("/login?next=%2Fdashboard"));
  await shot(pub, "02-login", false);

  // ---------- Admin registers (ADMIN_EMAILS bootstrap) ----------
  const { page: admin } = await mk();
  await admin.goto(`${BASE}/register`);
  await admin.fill("#full_name", "Temur Axmedov");
  await admin.fill("#email", "admin@test.uz");
  await admin.fill("#password", "Admin12345");
  await admin.click("button[type=submit]");
  await admin.waitForURL("**/dashboard");
  ok("register → dashboard", admin.url().endsWith("/dashboard"));
  await admin.goto(`${BASE}/admin`);
  ok("admin bootstrap via ADMIN_EMAILS", admin.url().endsWith("/admin"), admin.url());
  await shot(admin, "10-admin-overview");

  // group
  await admin.goto(`${BASE}/admin/groups`);
  await admin.fill("#gname", "A1-ertalabki");
  await admin.fill("#gsched", "Du/Chor/Ju 9:00");
  await admin.getByRole("button", { name: "Yaratish" }).click();
  await admin.getByText("A1-ertalabki").first().waitFor();
  ok("create group", true);

  // student via modal
  await admin.goto(`${BASE}/admin/students`);
  await admin.getByRole("button", { name: /Talaba qo'shish/ }).click();
  await admin.fill("#fn", "Aziza Karimova");
  await admin.fill("#em", "aziza@test.uz");
  await admin.fill("#pw", "Student123");
  await admin.selectOption("#gr", { label: "A1-ertalabki" });
  await admin.getByRole("button", { name: "Qo'shish", exact: true }).click();
  await admin.getByText(/qo'shildi/).waitFor({ timeout: 15000 });
  ok("create student (service role)", true);
  await admin.goto(`${BASE}/admin/students`);
  await shot(admin, "11-admin-students");

  // homework
  await admin.goto(`${BASE}/admin/homework/new`);
  await admin.getByText("Schreiben").first().click();
  await admin.fill("#title", "Meine Familie — 60 Wörter");
  await admin.fill("#instructions", "Oilangiz haqida 60 so'zli matn yozing.");
  await admin.fill("#min_words", "5");
  await admin.getByRole("button", { name: "Yaratish" }).click();
  await admin.waitForURL(/\/admin\/homework\/[0-9a-f-]{36}/);
  ok("create homework", true);

  // announcement
  await admin.goto(`${BASE}/admin/announcements`);
  await admin.fill("#title", "Ertaga dars soat 10:00 da");
  await admin.fill("#body", "Iltimos, kechikmang.");
  await admin.getByRole("button", { name: "Yuborish" }).click();
  await admin.getByText(/E'lon chiqarildi/).waitFor();
  ok("create announcement", true);

  // lesson editor screenshots
  const lessons = await rest("lessons?select=id,position&order=position&limit=2");
  await admin.goto(`${BASE}/admin/lessons/${lessons[0].id}?tab=questions`);
  await admin.getByText("Variantlar").first().waitFor();
  await shot(admin, "12-admin-lesson-questions");
  await admin.goto(`${BASE}/admin/lessons/${lessons[0].id}?tab=details`);
  await admin.fill("#video_url", "https://youtu.be/dQw4w9WgXcQ");
  await admin.getByRole("button", { name: /Saqlash/ }).click();
  await admin.getByText("Saqlandi").waitFor();
  ok("lesson video URL saved", true);

  // ---------- Student ----------
  const { page: st } = await mk();
  await st.goto(`${BASE}/login`);
  await st.fill("#email", "aziza@test.uz");
  await st.fill("#password", "Student123");
  await st.click("button[type=submit]");
  await st.waitForURL("**/dashboard");
  await st.waitForTimeout(500);
  await shot(st, "20-student-dashboard");
  ok("student dashboard shows next lesson", await st.getByText("Hallo! Wie heißt du?").first().isVisible());

  await st.goto(`${BASE}/notifications`);
  const notifText = await st.locator("main").innerText();
  ok("homework + announcement notifications", /Yangi uy vazifasi/.test(notifText) && /Ertaga dars/.test(notifText));
  await shot(st, "21-notifications");

  await st.goto(`${BASE}/learn`);
  await shot(st, "22-curriculum");
  await st.goto(`${BASE}/learn/${lessons[1].id}`);
  await st.waitForURL(/\/learn$/, { timeout: 8000 }).catch(() => {});
  ok("locked lesson redirects", st.url().endsWith("/learn"), st.url());

  await st.goto(`${BASE}/learn/${lessons[0].id}`);
  await shot(st, "23-lesson");
  ok("lesson shows youtube embed", (await st.locator("iframe").count()) === 1);
  await st.getByRole("button", { name: /Kartochkalarga qo'shish/ }).click();
  await st.getByText(/so'z qo'shildi/).waitFor();
  ok("add lesson cards", true);

  // Take test: answer first 3 wrong-ish (fail), then correctly
  await st.goto(`${BASE}/learn/${lessons[0].id}/test`);
  const qs = await rest(`questions?select=id,kind,position,question_keys(answer)&lesson_id=eq.${lessons[0].id}&order=position`);
  await shot(st, "24-test-question", false);
  // fail attempt: submit without answers
  for (let i = 0; i < qs.length - 1; i++) await st.getByRole("button", { name: /Keyingi/ }).click();
  await st.getByRole("button", { name: /Topshirish/ }).click();
  await st.getByText("Bu safar yetmadi").waitFor();
  ok("failed test shows retry", true);
  await shot(st, "25-test-failed");
  await st.getByRole("button", { name: /Qayta topshirish/ }).click();
  for (const q of qs) {
    const key = q.question_keys.answer;
    if (q.kind === "text") await st.fill("input[placeholder='Nemischa javob…']", key.accepted[0]);
    else await st.locator("main button").filter({ hasText: /./ }).locator("xpath=.").nth(0).waitFor();
    if (q.kind === "single") {
      const opts = st.locator("div.grid.gap-2\\.5 > button");
      await opts.nth(key.index).click();
    }
    if (q !== qs[qs.length - 1]) await st.getByRole("button", { name: /Keyingi/ }).click();
  }
  await st.getByRole("button", { name: /Topshirish/ }).click();
  await st.getByText("Ajoyib, test topshirildi!").waitFor();
  const scoreText = await st.locator("main").innerText();
  ok("perfect test passes & unlocks", /100%/.test(scoreText) && /Keyingi dars ochildi/.test(scoreText));
  await shot(st, "26-test-passed");
  await st.goto(`${BASE}/learn/${lessons[1].id}`);
  ok("lesson 2 now open", st.url().includes(lessons[1].id));

  // Homework submission
  await st.goto(`${BASE}/homework`);
  await shot(st, "27-homework-list");
  await st.getByText("Meine Familie — 60 Wörter").click();
  await st.locator("textarea").fill("Ich heiße Aziza. Meine Familie ist groß. Mein Vater ist Lehrer.");
  await st.getByRole("button", { name: /^Topshirish/ }).click();
  await st.getByText(/Vazifa topshirildi/).waitFor();
  ok("submit homework", true);
  await shot(st, "28-homework-submitted");

  // Dictionary + translator fallback
  await st.goto(`${BASE}/dictionary?q=Bahnhof`);
  ok("dictionary search", await st.getByText("vokzal").first().isVisible());
  await shot(st, "29-dictionary");
  await st.goto(`${BASE}/dictionary?tab=translate`);
  await st.locator("textarea").fill("der Bahnhof");
  await st.getByRole("button", { name: /Tarjima qilish/ }).click();
  await st.getByText(/AI tarjimon ulanmagan/).waitFor({ timeout: 15000 });
  ok("translator dictionary fallback", await st.getByText("vokzal").first().isVisible());
  await shot(st, "30-translator");

  // Flashcards
  await st.goto(`${BASE}/flashcards`);
  await st.waitForTimeout(400);
  await shot(st, "31-flashcards", false);
  await st.keyboard.press("Space");
  await st.waitForTimeout(600);
  await shot(st, "32-flashcard-back", false);
  await st.keyboard.press("3");
  await st.waitForTimeout(300);
  ok("flashcard review advanced", /1\/7/.test(await st.locator("main").innerText()));

  // ---------- Admin grades homework ----------
  await admin.goto(`${BASE}/admin/homework`);
  await admin.getByText("Meine Familie — 60 Wörter").click();
  await admin.locator("#score").fill("90");
  await admin.locator("#fb").fill("Sehr gut! Artikllarga e'tibor bering.");
  await admin.getByRole("button", { name: /Baholash/ }).click();
  await admin.getByText(/Baholandi/).waitFor();
  ok("grade homework", true);
  await shot(admin, "13-admin-grading");

  // realtime: student should get a toast/badge
  await st.goto(`${BASE}/dashboard`);
  await st.waitForTimeout(800);
  await st.goto(`${BASE}/homework?tab=done`);
  ok("student sees grade", await st.getByText("90/100").isVisible());

  // ---------- Live game ----------
  await admin.goto(`${BASE}/admin/games`);
  await admin.getByRole("button", { name: /Boshlash/ }).first().click();
  await admin.waitForURL(/\/admin\/games\/host\//);
  const code = (await admin.locator("div.font-mono").first().innerText()).replace(/\s/g, "");
  ok("game created with 6-digit ID", /^\d{6}$/.test(code), code);
  await st.goto(`${BASE}/games`);
  await shot(st, "33-games-join", false);
  await st.fill("#code", code);
  await st.getByRole("button", { name: /Qo'shilish/ }).click();
  await st.waitForURL(/\/games\/play\//);
  await admin.getByText("Aziza").waitFor({ timeout: 10000 });
  ok("host sees joined player (realtime)", true);
  await shot(admin, "14-host-lobby");
  await admin.getByRole("button", { name: /Boshlash/ }).click();
  await st.getByText(/Savol 1\/12/).waitFor({ timeout: 10000 });
  ok("player receives question (realtime)", true);
  await shot(st, "34-game-question", false);
  // answer correctly using key
  const sess = await rest(`game_sessions?select=set_id&code=eq.${code}`);
  const gq = await rest(`game_questions?select=id,position,game_question_keys(correct_index)&set_id=eq.${sess[0].set_id}&order=position,id&limit=1`);
  const ci = gq[0].game_question_keys.correct_index;
  await st.locator("div.grid.grid-cols-2 > button").nth(ci).click();
  await st.getByText(/To'g'ri! \+\d+/).waitFor({ timeout: 15000 });
  ok("answer scored + auto reveal", true);
  await shot(st, "35-game-reveal", false);
  await shot(admin, "15-host-reveal");

  // ---------- Progress / achievements / settings / mobile ----------
  await st.goto(`${BASE}/progress`);
  await shot(st, "36-progress");
  await st.goto(`${BASE}/achievements`);
  ok("achievement unlocked", (await st.locator("main").innerText()).includes("ochildi"));
  await shot(st, "37-achievements");

  await admin.goto(`${BASE}/admin/randomizer`);
  await admin.getByRole("button", { name: /Tanlash/ }).click();
  await admin.waitForTimeout(2500);
  ok("randomizer picks", (await admin.locator("main").innerText()).includes("Aziza Karimova"));
  await shot(admin, "16-randomizer");
  await admin.goto(`${BASE}/admin/attendance`);
  await admin.getByRole("button", { name: /Saqlash/ }).click();
  await admin.getByText("Saqlandi").waitFor();
  ok("attendance saved", true);
  await admin.goto(`${BASE}/admin/settings`);
  await shot(admin, "17-settings");

  // mobile
  const { page: mob } = await mk({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mob.goto(`${BASE}/login`);
  await mob.fill("#email", "aziza@test.uz");
  await mob.fill("#password", "Student123");
  await mob.click("button[type=submit]");
  await mob.waitForURL("**/dashboard");
  await mob.waitForTimeout(500);
  await shot(mob, "40-mobile-dashboard");
  const overflow = await mob.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  ok("mobile: no horizontal overflow", !overflow);
  await mob.goto(`${BASE}/learn`);
  await shot(mob, "41-mobile-learn");
  await mob.goto(BASE);
  await shot(mob, "42-mobile-landing");
  ok("mobile landing no overflow", !(await mob.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));

  // dark mode
  const { page: dark } = await mk({ colorScheme: "dark" });
  await dark.goto(`${BASE}/login`);
  await dark.fill("#email", "aziza@test.uz");
  await dark.fill("#password", "Student123");
  await dark.click("button[type=submit]");
  await dark.waitForURL("**/dashboard");
  await dark.waitForTimeout(500);
  await shot(dark, "50-dark-dashboard");
  // student cannot reach admin
  await dark.goto(`${BASE}/admin`);
  ok("student blocked from /admin", dark.url().endsWith("/dashboard"));
} catch (e) {
  results.push(`ERROR  ${e.message.split("\n")[0]}`);
} finally {
  await browser.close();
  console.log(results.join("\n"));
  console.log(`\n${errors.length} browser errors`);
  console.log([...new Set(errors)].slice(0, 15).join("\n"));
}
