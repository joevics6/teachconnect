"use client"

import { useState, useRef } from "react"
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { Logo } from "@/components/ui/Logo"
import { compressImage } from "@/lib/image-compress"

export default function AdminBrandingPage() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    setSuccess(false)
    try {
      const compressed = file.type === "image/svg+xml" ? file : await compressImage(file, { maxDimension: 512 })
      const fd = new FormData()
      fd.append("logo", compressed)
      const res = await fetch("/api/admin/branding/logo", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setSuccess(true)
      setPreviewKey((k) => k + 1) // bust the <img> cache so the new logo shows immediately
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Branding</h1>
        <p className="text-sm text-gray-500 mb-6">
          Replace the site logo shown across the navbar, footer, dashboard sidebars, and auth pages.
          Uploads immediately — no redeploy needed.
        </p>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-5">
            <div key={previewKey} className="border border-gray-200 rounded-lg p-3">
              <Logo className="h-12 w-12" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Current logo</p>
              <p className="text-xs text-gray-400">PNG, SVG, WEBP, or JPEG · Max 2MB</p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/svg+xml,image/webp,image/jpeg"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-gray-300 hover:border-ink-400 hover:bg-ink-50 transition text-sm font-medium text-gray-600 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload new logo"}
          </button>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-ink-700 text-sm mt-3">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> Logo updated. Refresh other tabs to see it everywhere.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  )
}
