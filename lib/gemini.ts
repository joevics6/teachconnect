// ============================================================
// lib/gemini.ts
// Shared, resilient Gemini call helper: tries multiple models across
// multiple API keys before giving up, instead of a single model/key
// with no real fallback. The most common real-world cause of
// "parsing failed" isn't the model being wrong, it's a single key
// hitting Gemini's free-tier rate/quota limit — rotating across
// several keys (each with its own quota) fixes that directly.
//
// Expects up to 3 Gemini API keys in env vars:
//   GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3
// Only GEMINI_API_KEY is required; the other two are used if set.
// If your Vercel project already has multiple Gemini keys under
// different names, rename them to match (or tell me the actual names
// and I'll adjust this list) — this file is the only place that needs
// to change.
// ============================================================

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter((k): k is string => Boolean(k && k.trim()))

const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"]

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
  if (API_KEYS.length === 0) {
    throw new GeminiError("No Gemini API key configured")
  }

  const parts: Record<string, unknown>[] = options?.inlineData
    ? [{ inline_data: { mime_type: options.inlineData.mimeType, data: options.inlineData.data } }, { text: prompt }]
    : [{ text: prompt }]

  let lastErr: unknown = null

  for (const model of MODELS) {
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
