"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"

interface FormState {
  title: string
  slug: string
  excerpt: string
  body: string
  author: string
  cover_image_url: string
  tags: string
  read_time_minutes: string
  seo_title: string
  seo_description: string
  is_published: boolean
}

const EMPTY: FormState = {
  title: "", slug: "", excerpt: "", body: "", author: "", cover_image_url: "",
  tags: "", read_time_minutes: "", seo_title: "", seo_description: "", is_published: false,
}

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
}

export default function AdminBlogFormPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const isNew = id === "new"

  const [form, setForm] = useState<FormState>(EMPTY)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/blog/${id}`)
      .then(async (res) => {
        if (!res.ok) { setError("Post not found."); return }
        const data = await res.json()
        const p = data.post
        setForm({
          title: p.title || "", slug: p.slug || "", excerpt: p.excerpt || "", body: p.body || "",
          author: p.author || "", cover_image_url: p.cover_image_url || "",
          tags: (p.tags || []).join(", "), read_time_minutes: p.read_time_minutes?.toString() || "",
          seo_title: p.seo_title || "", seo_description: p.seo_description || "",
          is_published: !!p.is_published,
        })
        setSlugTouched(true)
      })
      .catch(() => setError("Failed to load post."))
      .finally(() => setIsLoading(false))
  }, [id, isNew])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleTitleChange = (title: string) => {
    set("title", title)
    if (!slugTouched) set("slug", slugify(title))
  }

  const handleSave = async () => {
    setError("")
    if (!form.title || !form.slug || !form.excerpt) {
      setError("Title, slug, and excerpt are required.")
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        read_time_minutes: form.read_time_minutes ? parseInt(form.read_time_minutes, 10) : null,
      }
      const res = await fetch(isNew ? "/api/admin/blog" : `/api/admin/blog/${id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to save.")
        return
      }
      router.push("/admin/blog")
    } catch {
      setError("Failed to save.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-green-600 animate-spin" /></div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="h-4 w-4" />Back to Blog
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mb-6">{isNew ? "New Blog Post" : "Edit Blog Post"}</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <Field label="Title *">
            <input className={inputClass} value={form.title} onChange={(e) => handleTitleChange(e.target.value)} />
          </Field>
          <Field label="Slug *">
            <input className={inputClass} value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value) }} />
          </Field>
          <Field label="Excerpt *">
            <textarea rows={2} className={inputClass} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          </Field>
          <Field label="Body">
            <textarea rows={12} className={inputClass} value={form.body} onChange={(e) => set("body", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Author">
              <input className={inputClass} value={form.author} onChange={(e) => set("author", e.target.value)} />
            </Field>
            <Field label="Read time (minutes)">
              <input type="number" className={inputClass} value={form.read_time_minutes} onChange={(e) => set("read_time_minutes", e.target.value)} />
            </Field>
          </div>

          <Field label="Cover image URL">
            <input className={inputClass} value={form.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} />
          </Field>

          <Field label="Tags (comma-separated)">
            <input className={inputClass} value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </Field>

          <Field label="SEO title">
            <input className={inputClass} value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
          </Field>
          <Field label="SEO description">
            <textarea rows={2} className={inputClass} value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
          </Field>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_published} onChange={(e) => set("is_published", e.target.checked)} />
            Published (visible on the public Blog page)
          </label>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? "Create Post" : "Save Changes"}
          </button>
        </div>
      </div>
    </AdminShell>
  )
}

const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
