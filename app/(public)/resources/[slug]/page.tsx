"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft, BookOpen, TrendingUp, Building2,
  GraduationCap, Star, Loader2, Calendar, Share2, CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  cover_image_url: string | null
  published_at: string
  author_name: string | null
}

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  published_at: string
}

const CATEGORY_COLORS: Record<string, string> = {
  "Career Advice":     "bg-green-100 text-green-700",
  "School Management": "bg-blue-100 text-blue-700",
  "TRCN Guide":        "bg-purple-100 text-purple-700",
  "Salary Insights":   "bg-orange-100 text-orange-700",
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Career Advice":     TrendingUp,
  "School Management": Building2,
  "TRCN Guide":        GraduationCap,
  "Salary Insights":   Star,
}

export default function ResourceDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [post, setPost]           = useState<Post | null>(null)
  const [related, setRelated]     = useState<RelatedPost[]>([])
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [copied, setCopied]       = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/resources/posts/${slug}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) return
        const data = await res.json()
        setPost(data.post)
        setRelated(data.related || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [slug])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Article not found</h1>
        <p className="text-gray-500 mb-6">This article may have been removed or the link is incorrect.</p>
        <Link href="/resources">
          <Button className="bg-green-600 hover:bg-green-700 text-white">Back to Resources</Button>
        </Link>
      </div>
    )
  }

  const CategoryIcon = CATEGORY_ICONS[post.category] || BookOpen
  const categoryColor = CATEGORY_COLORS[post.category] || "bg-gray-100 text-gray-600"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover */}
      <div className="bg-white border-b border-gray-100">
        {post.cover_image_url && (
          <div className="w-full h-56 md:h-80 overflow-hidden">
            <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <Link href="/resources" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition">
          <ArrowLeft className="h-4 w-4" />All Resources
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
            <CategoryIcon className="h-3 w-3" />{post.category}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.published_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          {post.author_name && (
            <span className="text-xs text-gray-400">By {post.author_name}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>
        <p className="text-base text-gray-500 mb-8 leading-relaxed border-l-4 border-green-500 pl-4 italic">{post.excerpt}</p>

        {/* Content */}
        <article className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10 mb-8">
          {post.content ? (
            <div
              className="prose prose-gray prose-sm md:prose-base max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-p:text-gray-600 prose-p:leading-relaxed
                prose-li:text-gray-600 prose-li:leading-relaxed
                prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900
                prose-blockquote:border-green-500 prose-blockquote:text-gray-500"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            // Fallback: render excerpt as content if no full content field
            <p className="text-gray-600 leading-relaxed">{post.excerpt}</p>
          )}
        </article>

        {/* Share */}
        <div className="flex items-center gap-3 mb-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="flex items-center gap-2"
          >
            {copied ? <><CheckCircle2 className="h-4 w-4 text-green-600" />Copied!</> : <><Share2 className="h-4 w-4" />Copy Link</>}
          </Button>
          <Link href="/resources">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />More Articles
            </Button>
          </Link>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((r) => {
                const RelIcon = CATEGORY_ICONS[r.category] || BookOpen
                const relColor = CATEGORY_COLORS[r.category] || "bg-gray-100 text-gray-600"
                return (
                  <Link key={r.id} href={`/resources/${r.slug}`}>
                    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-green-200 hover:shadow-sm transition-all group">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${relColor}`}>
                        <RelIcon className="h-3 w-3" />{r.category}
                      </span>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-green-600 transition-colors line-clamp-2">
                        {r.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{r.excerpt}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
