"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Calendar, Clock, ArrowLeft, Loader2, Newspaper, User } from "lucide-react"

interface Post {
  id: string
  title: string
  excerpt: string
  body: string | null
  author: string | null
  cover_image_url: string | null
  tags: string[]
  read_time_minutes: number | null
  published_at: string
}

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string
  cover_image_url: string | null
  published_at: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string

  const [post, setPost] = useState<Post | null>(null)
  const [related, setRelated] = useState<RelatedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/blog/posts/${slug}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) return
        const data = await res.json()
        setPost(data.post)
        setRelated(data.related || [])
      })
      .catch((err) => console.error("Failed to load blog post:", err))
      .finally(() => setIsLoading(false))
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-ink-600 animate-spin" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Newspaper className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">Post not found.</p>
          <Link href="/blog" className="text-ink-600 hover:underline text-sm">Back to Blog</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft className="h-4 w-4" />Back to Blog
        </Link>

        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} className="w-full h-64 object-cover rounded-xl mb-6" />
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8">
          {post.author && (
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{post.author}</span>
          )}
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(post.published_at)}</span>
          {post.read_time_minutes && (
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.read_time_minutes} min read</span>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <p className="text-gray-600 text-lg mb-6 leading-relaxed">{post.excerpt}</p>
          {post.body && (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.body}
            </div>
          )}
        </div>

        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {post.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">More from the blog</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <p className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">{r.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
