import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseServer } from "@/lib/supabase/server";
import { hasAI, translateWithClaude, type Translation } from "@/lib/ai/translate";
import { withArticle } from "@/lib/utils";

const Body = z.object({ text: z.string().trim().min(1).max(2000), direction: z.enum(["de-uz", "uz-de"]) });
const HOURLY_LIMIT = 60;

export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Matn 1–2000 belgi bo'lishi kerak" }, { status: 400 });
  const { text, direction } = parsed.data;

  const { data: enabled } = await supabase.from("app_settings").select("value").eq("key", "translator_enabled").maybeSingle();
  if (enabled && enabled.value === false) return NextResponse.json({ error: "Tarjimon vaqtincha o'chirilgan" }, { status: 403 });

  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase.from("translations").select("id", { count: "exact", head: true }).gte("created_at", since);
  if ((count ?? 0) >= HOURLY_LIMIT) return NextResponse.json({ error: "Soatlik limit tugadi. Birozdan so'ng urinib ko'ring." }, { status: 429 });

  let result: Translation & { source: "ai" | "dictionary" };
  if (hasAI()) {
    try {
      result = { ...(await translateWithClaude(text, direction)), source: "ai" };
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "AI band. Birozdan so'ng urinib ko'ring." }, { status: 429 });
      if (error instanceof Anthropic.APIError) console.error("translate", error.status, error.message);
      else console.error("translate", error);
      result = { ...(await dictionaryFallback(supabase, text, direction)), source: "dictionary" };
    }
  } else {
    result = { ...(await dictionaryFallback(supabase, text, direction)), source: "dictionary" };
  }

  if (result.translation) {
    await supabase.from("translations").insert({ user_id: uid, direction, source: text, result: result.translation });
  }
  return NextResponse.json(result);
}

/** Word-by-word lookup in the platform dictionary when AI is not configured. */
async function dictionaryFallback(
  supabase: Awaited<ReturnType<typeof supabaseServer>>, text: string, direction: "de-uz" | "uz-de",
): Promise<Translation> {
  const tokens = [...new Set(text.toLowerCase().match(/[\p{L}'ʻ’-]+/gu) ?? [])].slice(0, 25);
  const col = direction === "de-uz" ? "de" : "uz";
  const words: Translation["words"] = [];
  for (const t of tokens) {
    const { data } = await supabase.from("vocabulary").select("de,article,plural,uz").ilike(col, direction === "de-uz" ? t : `%${t}%`).limit(1);
    const v = data?.[0];
    if (v) words.push({ source: direction === "de-uz" ? withArticle(v) : v.uz, target: direction === "de-uz" ? v.uz : withArticle(v), info: v.plural ? `ko'plik: ${v.plural}` : "" });
  }
  return {
    translation: words.length ? words.map((w) => w.target).join(" · ") : "",
    alternatives: [],
    notes: words.length
      ? "AI tarjimon ulanmagan — natija lug'atdan so'zma-so'z olindi."
      : "AI tarjimon ulanmagan va lug'atda mos so'z topilmadi.",
    words,
  };
}
