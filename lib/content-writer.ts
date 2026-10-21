// ============================================================
// lib/content-writer.ts
// AI "auto-fill + clean" for admin blog posts and resources.
// Ported from the Toolbase admin article writer (extractArticleMetadata).
//
// THE PROMPT IS SENSITIVE — the scissors-edit instructions (link cleanup,
// AI-commentary removal, "do not reword") are copied verbatim from Toolbase.
// Only the "Return JSON with these fields" list is adapted to ClassHire's
// blog_posts / resource_posts columns. Do not edit the wording below.
//
// Server-only (reads Gemini keys from env). Uses the Gemini 3.5 models.
// ============================================================

import { z } from "zod"

/** Tried in order: primary first, then each fallback. */
export const WRITER_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"] as const

export const WRITER_MAX_OUTPUT_TOKENS = 20000

/** Must match CATEGORIES in app/admin/resources/[id]/page.tsx */
export const RESOURCE_CATEGORIES = [
  "Career Advice",
  "School Management",
  "TRCN Guide",
  "Salary Insights",
] as const

export type ContentKind = "blog" | "resource"

/** Every Gemini key found in env (GEMINI_API_KEY, GEMINI_API_KEY_2, ...). */
function getGeminiKeys(): string[] {
  const keys = Object.entries(process.env)
    .filter(([name, v]) => /^GEMINI_API/i.test(name) && typeof v === "string" && v.trim())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => (v as string).trim())
  const unique = Array.from(new Set(keys))
  if (unique.length === 0) throw new Error("No Gemini API key configured")
  return unique
}

let rotation = 0

async function withGeminiFallback<T>(
  label: string,
  fn: (model: string, apiKey: string) => Promise<T>
): Promise<T> {
  const keys = getGeminiKeys()
  const start = rotation++ % keys.length
  const orderedKeys = keys.map((_, i) => keys[(start + i) % keys.length])
  let lastErr: unknown
  for (const model of WRITER_MODELS) {
    for (const key of orderedKeys) {
      try {
        return await fn(model, key)
      } catch (err) {
        lastErr = err
      }
    }
  }
  throw new Error(`${label} failed: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`)
}

// ─── Prompt (verbatim from Toolbase, fields list adapted) ─────────────────

const PROMPT_INTRO = `You are a precise editor. DO NOT rewrite, summarize, paraphrase, or reword the article. You may ONLY make surgical (scissors) edits. Preserve every heading, table, list, blockquote, paragraph, and the author's exact wording.

Return JSON with these fields:

`

const FIELD_SLUG = `"slug" — url slug for the article. If the content or title suggests one, use it; otherwise derive a kebab-case slug from the title (lowercase, hyphens).`
const FIELD_TITLE = `"title" — the article's H1 / main title as plain text (no markdown).`
const FIELD_TAGS = `"tags" — array of 3 to 6 short lowercase tags relevant to the content (e.g. ["teacher recruitment", "trcn", "salary"]). Empty array if none.`
const FIELD_CATEGORY = `"category" — pick the ONE best fit, exactly as written, from: ${RESOURCE_CATEGORIES.join(", ")}.`
const FIELD_EXCERPT = `"excerpt" — 1-2 sentence teaser (~200 chars max) drawn from the intro. Plain text, no markdown.`
const FIELD_SEO_TITLE = `"seo_title" — SEO title under 60 chars, plain text.`
const FIELD_SEO_DESCRIPTION = `"seo_description" — SEO description under 155 chars, plain text.`
const FIELD_READING_TIME = `"reading_time_minutes" — integer, based on ~220 words/min.`

// "cleaned_content" item + TITLE/CONTENT block — verbatim, do not edit.
const PROMPT_CLEANED_CONTENT_AND_INPUT = `"cleaned_content" — the SAME markdown, with ONLY the following scissors edits applied:

   a. LINK CLEANUP — the source often appends bare citation-style links at the end of sentences like: "automated PDFs for Nigerian businesses. [nitda.gov](https://nitda.gov.ng/...)". These are NOT natural. For every such trailing bare-domain link:
      - Pick at most the 5 BEST, most authoritative external links across the WHOLE article (prefer official gov sites and primary sources). Delete every other trailing bare-domain citation entirely, including any leading space or stray punctuation orphaned by the removal — but keep the surrounding sentence intact.
      - For the kept 5, rewrite them as inline anchors integrated naturally into the nearest preceding sentence. Do this by turning a relevant NOUN PHRASE already in that sentence into the anchor text — e.g. change "automated PDFs for Nigerian businesses. [nitda.gov](https://nitda.gov.ng/x)" into "automated PDFs for [Nigerian businesses](https://nitda.gov.ng/x)." Do NOT invent new sentences or add commentary. If no reasonable noun phrase exists, drop that link too.
      - Internal links (relative paths, same-site) are not counted against the 5-link cap; keep them and also inline them naturally the same way if they appear as trailing bare-domain citations.

   b. REMOVE AI COMMENTARY — the source often contains meta commentary aimed at the human editor. Remove all of the following completely:
      - Word-count notes: "(Word count: 1,240)", "**Word count:** ...", "Total words: ..."
      - Placeholders/notes: "TK", "TODO", "[insert stat here]"
      - Meta explanations of keywords/headings/SEO choices ("This heading targets the keyword ...", "I chose this title because ...", "Note to editor: ...")
      - Preambles/sign-offs: "Here is the article:", "Below is the rewritten piece:", "Let me know if you want ...", "I hope this helps ..."
      - Stray HTML tags that don't belong, duplicated headings, leftover prompt fragments

   c. Do NOT change any other wording. If a paragraph has no defects, return it verbatim.

TITLE (may be empty):
{{TITLE}}

CONTENT:
{{CONTENT}}`

function fieldsFor(kind: ContentKind): string[] {
  return kind === "resource"
    ? [FIELD_SLUG, FIELD_TITLE, FIELD_CATEGORY, FIELD_TAGS, FIELD_EXCERPT, FIELD_SEO_TITLE, FIELD_SEO_DESCRIPTION, FIELD_READING_TIME]
    : [FIELD_SLUG, FIELD_TITLE, FIELD_TAGS, FIELD_EXCERPT, FIELD_SEO_TITLE, FIELD_SEO_DESCRIPTION, FIELD_READING_TIME]
}

function buildPrompt(kind: ContentKind, title: string, content: string): string {
  const fields = fieldsFor(kind)
  const numbered = fields.map((f, i) => `${i + 1}. ${f}`).join("\n")
  const prompt =
    PROMPT_INTRO + numbered + "\n" + `${fields.length + 1}. ` + PROMPT_CLEANED_CONTENT_AND_INPUT
  // function replacers so "$" sequences in pasted content are never interpreted
  return prompt.replace("{{TITLE}}", () => title || "").replace("{{CONTENT}}", () => content)
}

// ─── Gemini call ──────────────────────────────────────────────────────────

const ExtractSchema = z.object({
  slug: z.string(),
  title: z.string(),
  category: z.string().optional(),
  tags: z.array(z.string()),
  excerpt: z.string(),
  seo_title: z.string(),
  seo_description: z.string(),
  reading_time_minutes: z.number().int(),
  cleaned_content: z.string(),
})

export type ExtractedContent = z.infer<typeof ExtractSchema>

function responseSchemaFor(kind: ContentKind) {
  const properties: Record<string, unknown> = {
    slug: { type: "string" },
    title: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    excerpt: { type: "string" },
    seo_title: { type: "string" },
    seo_description: { type: "string" },
    reading_time_minutes: { type: "integer" },
    cleaned_content: { type: "string" },
  }
  const required = [
    "slug", "title", "tags", "excerpt", "seo_title", "seo_description",
    "reading_time_minutes", "cleaned_content",
  ]
  if (kind === "resource") {
    properties.category = { type: "string", enum: [...RESOURCE_CATEGORIES] }
    required.push("category")
  }
  return { type: "object", properties, required }
}

async function callGemini(model: string, apiKey: string, kind: ContentKind, prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: WRITER_MAX_OUTPUT_TOKENS,
          responseSchema: responseSchemaFor(kind),
        },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${model} ${res.status}: ${await res.text()}`)
  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error(`Gemini ${model}: empty response`)
  return ExtractSchema.parse(JSON.parse(text))
}

export async function extractContent(
  kind: ContentKind,
  title: string,
  content: string
): Promise<ExtractedContent> {
  const prompt = buildPrompt(kind, title, content)
  return withGeminiFallback("AI extraction", (model, key) => callGemini(model, key, kind, prompt))
}
