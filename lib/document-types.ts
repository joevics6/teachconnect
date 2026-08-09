// ============================================================
// lib/document-types.ts
//
// Client-safe half of the document-upload single source of truth.
// lib/document-extract.ts (server-only — imports mammoth, a Node
// dependency) re-exports these so server code has one import, but
// any client component should import from HERE, not from
// document-extract.ts, to avoid pulling mammoth into the browser
// bundle.
// ============================================================

export const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
] as const

/** For file input `accept` attributes and client-side validation. */
export const ACCEPTED_DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"]

/** Human-readable, for hint text under an upload control. */
export const ACCEPTED_DOCUMENT_LABEL = "PDF, DOC, DOCX, JPG, or PNG"

export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export function isAcceptedDocumentType(mimeType: string): boolean {
  return (ACCEPTED_DOCUMENT_TYPES as readonly string[]).includes(mimeType)
}

/** Value for a file input's `accept` attribute — mime list + extensions, for best browser filtering. */
export const DOCUMENT_INPUT_ACCEPT = [...ACCEPTED_DOCUMENT_TYPES, ...ACCEPTED_DOCUMENT_EXTENSIONS].join(",")
