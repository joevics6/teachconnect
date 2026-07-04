"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft, Download, ExternalLink, Play, FileText,
  BookOpen, Clock, Tag, Share2, CheckCircle2,
  Loader2, AlertCircle, Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Resource {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string                    // rich text / markdown content for SEO
  category: string
  resource_type: "article" | "pdf" | "document" | "video" | "youtube"
  cover_image_url: string | null
  file_url: string | null         // Supabase storage URL for files
  external_url: string | null     // YouTube link or external resource
  youtube_id: string | null       // extracted YT id for embed
  download_count: number
  read_time_minutes: number | null
  tags: string[]
  author: string | null
  published_at: string
  seo_title: string | null
  seo_description: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  "Career Advice":     "bg-green-100 text-green-700",
  "School Management": "bg-blue-100 text-blue-700",
  "TRCN Guide":        "bg-purple-100 text-purple-700",
  "Salary Insights":   "bg-orange-100 text-orange-700",
}

function ResourceTypeBadge({ type }: { type: Resource["resource_type"] }) {
  const map: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    article:  { icon: BookOpen,  label: "Article",   color: "bg-gray-100 text-gray-600" },
    pdf:      { icon: FileText,  label: "PDF",        color: "bg-red-100 text-red-600"  },
    document: { icon: FileText,  label: "Document",   color: "bg-blue-100 text-blue-600" },
    video:    { icon: Play,      label: "Video",      color: "bg-purple-100 text-purple-600" },
    youtube:  { icon: Play,      label: "Video",      color: "bg-red-100 text-red-600" },
  }
  const { icon: Icon, label, color } = map[type] || map.article
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

export default function ResourceDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [resource, setResource]     = useState<Resource | null>(null)
  const [related,  setRelated]      = useState<Resource[]>([])
  const [loading,  setLoading]      = useState(true)
  const [error,    setError]        = useState("")
  const [accessing, setAccessing]   = useState(false)
  const [accessed,  setAccessed]    = useState(false)
  const [copied,    setCopied]      = useState(false)

  useEffect(() => {
    fetch(`/api/resources/posts/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.resource) {
          setResource(data.resource)
          setRelated(data.related || [])
        } else {
          setError("Resource not found.")
        }
      })
      .catch(() => setError("Failed to load resource."))
      .finally(() => setLoading(false))
  }, [slug])

  const handleAccess = async () => {
    if (!resource) return
    setAccessing(true)
    try {
      // Increment download/view count
      await fetch(`/api/resources/posts/${slug}/access`, { method: "POST" })
      const url = resource.file_url || resource.external_url
      if (url) {
        window.open(url, "_blank")
        setAccessed(true)
      }
    } finally {
      setAccessing(false)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Resource not found</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link href="/resources">
            <Button variant="outline">← Back to Resources</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isYouTube = resource.resource_type === "youtube" || !!resource.youtube_id
  const isFile    = resource.resource_type === "pdf" || resource.resource_type === "document"
  const isVideo   = resource.resource_type === "video"
  const hasAccess = resource.file_url || resource.external_url

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <Link href="/resources" className="hover:text-gray-700">Resources</Link>
          <span>/</span>
          <span className="text-gray-900 truncate">{resource.title}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2">

            {/* Back */}
            <Link href="/resources" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5">
              <ArrowLeft className="h-4 w-4" />
              Back to Resources
            </Link>

            {/* Cover Image */}
            {resource.cover_image_url && (
              <div className="w-full h-56 rounded-2xl overflow-hidden mb-6 bg-gray-100">
                <img
                  src={resource.cover_image_url}
                  alt={resource.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <ResourceTypeBadge type={resource.resource_type} />
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[resource.category] || "bg-gray-100 text-gray-600"}`}>
                <Tag className="h-3 w-3" />
                {resource.category}
              </span>
              {resource.read_time_minutes && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {resource.read_time_minutes} min read
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
              {resource.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
              {resource.author && <span>By {resource.author}</span>}
              <span>
                {new Date(resource.published_at).toLocaleDateString("en-NG", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {resource.download_count.toLocaleString()} {isFile ? "downloads" : "views"}
              </span>
            </div>

            {/* Excerpt */}
            <p className="text-gray-600 text-base leading-relaxed mb-6 border-l-4 border-green-400 pl-4 italic">
              {resource.excerpt}
            </p>

            {/* YouTube Embed */}
            {isYouTube && resource.youtube_id && (
              <div className="aspect-video rounded-xl overflow-hidden bg-black mb-6">
                <iframe
                  src={`https://www.youtube.com/embed/${resource.youtube_id}`}
                  title={resource.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Body Content — SEO-rich text */}
            {resource.body && (
              <div
                className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-8"
                dangerouslySetInnerHTML={{ __html: resource.body }}
              />
            )}

            {/* Tags */}
            {resource.tags?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-6">
                <span className="text-xs text-gray-500 font-medium">Tags:</span>
                {resource.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Access Card */}
            {hasAccess && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
                <h3 className="font-bold text-gray-900 mb-1">
                  {isFile ? "Download" : isVideo || isYouTube ? "Watch" : "Access"} this resource
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {isFile
                    ? "Free to download — no sign-up required"
                    : "Free to access — no sign-up required"}
                </p>

                <Button
                  onClick={handleAccess}
                  disabled={accessing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white mb-3"
                >
                  {accessing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Opening…</>
                  ) : accessed ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" />Opened!</>
                  ) : isFile ? (
                    <><Download className="h-4 w-4 mr-2" />Download Free</>
                  ) : (
                    <><ExternalLink className="h-4 w-4 mr-2" />Access Resource</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="w-full text-sm"
                >
                  {copied
                    ? <><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />Link Copied!</>
                    : <><Share2 className="h-4 w-4 mr-2" />Share</>}
                </Button>

                <p className="text-xs text-gray-400 mt-3 text-center">
                  {resource.download_count.toLocaleString()} people have accessed this
                </p>
              </div>
            )}

            {/* Share only (if no file/link) */}
            {!hasAccess && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <Button variant="outline" onClick={handleShare} className="w-full text-sm">
                  {copied
                    ? <><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />Link Copied!</>
                    : <><Share2 className="h-4 w-4 mr-2" />Share this article</>}
                </Button>
              </div>
            )}

            {/* Related */}
            {related.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Related Resources</h3>
                <div className="space-y-3">
                  {related.map((r) => (
                    <Link key={r.id} href={`/resources/${r.slug}`} className="block group">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-green-600 transition line-clamp-2">
                        {r.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.category}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 text-white">
              <h3 className="font-bold mb-1 text-sm">Looking for teaching jobs?</h3>
              <p className="text-xs text-green-100 mb-3">
                Browse hundreds of teaching roles across Nigeria.
              </p>
              <Link href="/jobs">
                <Button size="sm" className="w-full bg-white text-green-700 hover:bg-green-50 text-xs">
                  Browse Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
