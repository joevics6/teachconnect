// ============================================================
// lib/gemini.ts
// Shared, resilient Gemini call helper: tries multiple models across
// multiple API keys before giving up, instead of a single model/key
// with no real fallback. The most common real-world cause of
// "parsing failed" isn't the model being wrong, it's a single key
// hitting Gemini's free-tier rate/quota limit — rotating across
// several keys (each with its own quota) fixes that directly.
//
// Models: same tiering as the JobPilot parser (lite -> flash -> third
// fallback), moved to the live Gemini 3.x line because the 2.5 models
// JobPilot lists (gemini-2.5-flash, -flash-lite, -flash-lite-preview-09-2025)
// are shut down / returning 404.
//
// Keys: up to 3, read from these env var names (only the first is required):
//   GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3
// Used by the job parsers/creator, and by the blog + resource AI writer
// (lib/content-writer.ts imports GEMINI_MODELS / getGeminiKeys from here).
// ============================================================

export const GEMINI_KEY_NAMES = ["GEMINI_API_KEY", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3"] as const

/** Models tried in order; each is tried against every configured key. */
export const GEMINI_MODELS = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3-flash-preview"] as const

/** The configured keys (max 3), in order, skipping any that are unset. */
export function getGeminiKeys(): string[] {
  return GEMINI_KEY_NAMES.map((name) => process.env[name]).filter((k): k is string =>
    Boolean(k && k.trim())
  )
}

export class GeminiError extends Error {}

/**
 * Sends `prompt` to Gemini, trying each model against each configured
 * key (model-major order: exhausts all keys on the fast/cheap model
 * before falling back to the stronger one) until one succeeds.
 * Returns the raw text response.
 */
export async function generateWithGemini(
  prompt: string,
  options?: {
    temperature?: number
    maxOutputTokens?: number
    inlineData?: { mimeType: string; data: string }
  }
): Promise<string> {
  const API_KEYS = getGeminiKeys()
  if (API_KEYS.length === 0) {
    throw new GeminiError("No Gemini API key configured")
  }

  const parts: Record<string, unknown>[] = options?.inlineData
    ? [{ inline_data: { mime_type: options.inlineData.mimeType, data: options.inlineData.data } }, { text: prompt }]
    : [{ text: prompt }]

  let lastErr: unknown = null

  for (const model of GEMINI_MODELS) {
    for (const key of API_KEYS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: options?.temperature ?? 0.1,
                maxOutputTokens: options?.maxOutputTokens ?? 1000,
              },
            }),
          }
        )

        if (!res.ok) {
          // 429 (rate limit) / 503 (overloaded) are exactly the case
          // this rotation exists for — move on to the next key/model
          // instead of surfacing an error immediately.
          const body = await res.json().catch(() => ({}))
          lastErr = new GeminiError(body?.error?.message || `${model} responded ${res.status}`)
          continue
        }

        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) {
          lastErr = new GeminiError(`${model} returned an empty response`)
          continue
        }
        return text
      } catch (err) {
        lastErr = err
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new GeminiError("All Gemini attempts failed")
}

/** Strips markdown code fences and stray control characters, then parses as JSON. */
export function parseGeminiJson<T = Record<string, unknown>>(text: string): T {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
  return JSON.parse(cleaned) as T
}
