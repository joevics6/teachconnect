"use client"

// ============================================================
// components/CvUploadField.tsx
//
// SINGLE SOURCE OF TRUTH for CV file picking, validation, and the
// upload/parse network call — used by both the registration wizard
// (mode="parse": extracts profile data via Gemini/mammoth, see
// lib/document-extract.ts) and the edit-profile page (mode="store":
// just replaces the stored CV, no extraction). Any future feature
// that needs a teacher to upload their CV should use this instead of
// rolling its own file input + validation + fetch call.
// ============================================================

import { useRef, useState } from "react"
import { Upload, FileText, Loader2 } from "lucide-react"
import {
  DOCUMENT_INPUT_ACCEPT,
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_DOCUMENT_LABEL,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/document-types"

interface CvUploadFieldProps {
  /** "dropzone" — large tap-to-upload zone (registration). "compact" — inline status + replace button (edit-profile). */
  variant?: "dropzone" | "compact"
  /** "parse" hits /api/teacher/parse-cv and returns extracted profile data via onParsed. "store" hits /api/teacher/profile/cv and just replaces the stored CV. */
  mode: "parse" | "store"
  /** Existing CV's display name/state, if any (e.g. "CV uploaded"). */
  currentLabel?: string | null
  disabled?: boolean
  onParsed?: (parsed: Record<string, unknown>, fileName: string) => void
  onStored?: (cvUrl: string, fileName: string) => void
  onError?: (message: string) => void
  /** Fires the moment a valid file is picked, before the network call — lets a parent page mirror busy/filename state into its own surrounding UI (e.g. a preview card). */
  onFileSelected?: (fileName: string) => void
  /** Extra fields appended to the parse-cv request (e.g. registration's temp_id). */
  extraFormFields?: Record<string, string>
}

export function CvUploadField({
  variant = "dropzone",
  mode,
  currentLabel,
  disabled,
  onParsed,
  onStored,
  onError,
  onFileSelected,
  extraFormFields,
}: CvUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!(ACCEPTED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
      onError?.(`Only ${ACCEPTED_DOCUMENT_LABEL} files are supported`)
      return
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      onError?.("File must be under 5MB")
      return
    }

    setFileName(file.name)
    setSuccess(false)
    setIsBusy(true)
    onFileSelected?.(file.name)

    try {
      const formData = new FormData()
      formData.append("cv", file)

      if (mode === "parse") {
        Object.entries(extraFormFields ?? {}).forEach(([k, v]) => formData.append(k, v))
        const res = await fetch("/api/teacher/parse-cv", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "CV parsing failed")
        setSuccess(true)
        onParsed?.(data.parsed, file.name)
      } else {
        const res = await fetch("/api/teacher/profile/cv", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Upload failed")
        setSuccess(true)
        onStored?.(data.cv_url, file.name)
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setIsBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const inputEl = (
    <input
      ref={inputRef}
      type="file"
      accept={DOCUMENT_INPUT_ACCEPT}
      onChange={handleChange}
      disabled={disabled || isBusy}
      className="hidden"
    />
  )

  if (variant === "compact") {
    const label = fileName || currentLabel
    return (
      <div>
        {inputEl}
        <div className={`flex items-center gap-3 p-3 border rounded-lg mb-3 ${
          label ? "bg-ink-50 border-ink-200" : "bg-gray-50 border-gray-200"
        }`}>
          <FileText className={`h-5 w-5 flex-shrink-0 ${label ? "text-ink-600" : "text-gray-400"}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${label ? "font-medium text-ink-800" : "text-gray-500"}`}>
              {label || "No CV uploaded yet"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isBusy}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-ink-400 hover:text-ink-700 transition disabled:opacity-50"
        >
          {isBusy ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
          ) : (
            <><Upload className="h-4 w-4" />{label ? "Replace CV" : "Upload CV"}</>
          )}
        </button>
      </div>
    )
  }

  // dropzone variant
  return (
    <div
      onClick={() => !isBusy && !disabled && inputRef.current?.click()}
      className={`flex items-center gap-3 w-full border-2 border-dashed rounded-xl transition ${
        disabled || isBusy ? "cursor-not-allowed" : "cursor-pointer"
      } ${
        success ? "p-3 border-ink-300 bg-ink-50"
        : isBusy ? "p-8 border-purple-300 bg-purple-50"
        : fileName ? "p-8 border-ink-400 bg-ink-50"
        : "p-8 sm:p-10 flex-col justify-center border-gray-300 hover:border-ink-400 hover:bg-ink-50"
      }`}
    >
      {inputEl}
      {success ? (
        <>
          <FileText className="h-5 w-5 text-ink-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-700 break-words">{fileName}</p>
            <p className="text-xs text-ink-500">Parsed ✓ — tap to replace</p>
          </div>
          <Upload className="h-4 w-4 text-ink-400 flex-shrink-0" />
        </>
      ) : fileName ? (
        <div className="flex flex-col items-center gap-3 w-full min-w-0">
          <FileText className="h-8 w-8 text-ink-600 flex-shrink-0" />
          <div className="text-center w-full min-w-0 px-2">
            <p className="text-sm font-medium text-ink-700 break-words">{fileName}</p>
            <p className="text-xs text-ink-500 mt-0.5">{isBusy ? "Parsing…" : "Tap to replace"}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="w-14 h-14 bg-ink-100 rounded-full flex items-center justify-center">
            <Upload className="h-6 w-6 text-ink-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Tap to upload your CV</p>
            <p className="text-xs text-gray-400 mt-1">{ACCEPTED_DOCUMENT_LABEL} · Max 5MB</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
            className="inline-flex items-center gap-2 bg-ink-600 hover:bg-ink-700 text-white mt-1 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Upload className="h-4 w-4" /> Upload CV
          </button>
        </div>
      )}
    </div>
  )
}
