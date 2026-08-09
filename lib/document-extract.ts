// ============================================================
// lib/document-extract.ts
//
// SINGLE SOURCE OF TRUTH for turning an uploaded document (CV, or
// any future document-upload feature) into something Gemini can
// read, regardless of format:
//   - PDF, JPG, PNG, WEBP → Gemini reads these natively (vision +
//     native PDF understanding), so they're sent as inline_data —
//     no separate extraction step, and generally more reliable for
//     CVs with columns/tables/layout than naive text extraction.
//   - DOC, DOCX → Gemini has no native support for Word documents,
//     so text is extracted first via mammoth and sent as plain text.
//
// Any feature that needs "upload a document, have Gemini read it"
// should use extractDocumentForGemini() + callGeminiWithDocument()
// here rather than rolling its own base64/mimeType handling, so
// format support (and any future format added) stays consistent
// everywhere instead of drifting between call sites.
//
// This file is server-only (imports mammoth). Client components
// (upload forms, dropzones) should import the shared constants from
// lib/document-types.ts instead — re-exported below for convenience
// in server code, but don't import THIS file from a "use client"
// component.
// ============================================================

import mammoth from "mammoth"
import { generateWithGemini } from "@/lib/gemini"
import {
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_DOCUMENT_LABEL,
  MAX_DOCUMENT_SIZE_BYTES,
  isAcceptedDocumentType,
} from "@/lib/document-types"

export { ACCEPTED_DOCUMENT_TYPES, ACCEPTED_DOCUMENT_LABEL, MAX_DOCUMENT_SIZE_BYTES, isAcceptedDocumentType }

type DocumentPayload =
  | { mode: "inline"; mimeType: string; data: string }
  | { mode: "text"; text: string }

const WORD_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

/** Reads an uploaded File into whatever shape Gemini needs for its format. */
export async function extractDocumentForGemini(file: File): Promise<DocumentPayload> {
  if (!isAcceptedDocumentType(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Accepted: ${ACCEPTED_DOCUMENT_LABEL}.`)
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (WORD_MIME_TYPES.has(file.type)) {
    const { value: text } = await mammoth.extractRawText({ buffer })
    if (!text.trim()) {
      throw new Error("Couldn't extract any text from this document — it may be empty, image-only, or corrupted.")
    }
    return { mode: "text", text }
  }

  // PDF or image — Gemini reads these natively.
  return { mode: "inline", mimeType: file.type, data: buffer.toString("base64") }
}

/**
 * Extracts `file` (any accepted format) and sends it to Gemini
 * alongside `prompt` in one call — the single entry point most
 * callers should use instead of extractDocumentForGemini directly.
 */
export async function callGeminiWithDocument(
  prompt: string,
  file: File,
  options?: { temperature?: number; maxOutputTokens?: number }
): Promise<string> {
  const payload = await extractDocumentForGemini(file)

  if (payload.mode === "inline") {
    return generateWithGemini(prompt, { ...options, inlineData: { mimeType: payload.mimeType, data: payload.data } })
  }

  // Word doc — no inline_data support, so the extracted text becomes
  // part of the prompt itself.
  return generateWithGemini(
    `${prompt}\n\n--- DOCUMENT CONTENT ---\n${payload.text}`,
    options
  )
}
