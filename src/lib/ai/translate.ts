import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

export const TranslationSchema = z.object({
  translation: z.string().describe("The full translation"),
  alternatives: z.array(z.string()).describe("Up to 3 alternative translations, may be empty"),
  notes: z.string().describe("Short grammar/usage explanation in Uzbek (Latin script), 1-3 sentences"),
  words: z
    .array(z.object({ source: z.string(), target: z.string(), info: z.string() }))
    .describe("Key words: German word with article/plural or verb forms in `info` (Uzbek), max 6"),
});
export type Translation = z.infer<typeof TranslationSchema>;

const SYSTEM = `You are the translator inside Temurlify, a German course for Uzbek speakers.
Translate between German and Uzbek (Latin script, modern orthography: o', g', sh, ch).
Keep meaning and register; prefer natural phrasing over word-for-word.
For German nouns in "words", always give the article and plural (e.g. "der Bahnhof, -¨e").
For verbs, give infinitive and Perfekt (e.g. "fahren – ist gefahren").
Write notes in Uzbek for a learner. If the input is not German or Uzbek, translate it anyway into the target language.`;

export const hasAI = () => Boolean(process.env.ANTHROPIC_API_KEY);

export async function translateWithClaude(text: string, direction: "de-uz" | "uz-de"): Promise<Translation> {
  const client = new Anthropic();
  const [from, to] = direction === "de-uz" ? ["German", "Uzbek"] : ["Uzbek", "German"];
  const response = await client.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    output_config: { effort: "low", format: zodOutputFormat(TranslationSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: `Translate from ${from} to ${to}:\n\n${text}` }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("Tarjima qilib bo'lmadi");
  }
  return response.parsed_output;
}
