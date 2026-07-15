"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Calendar, Clock, Loader2, Newspaper } from "lucide-react"

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string | null
  cover_image_url: string | null
  tags: string[]
  read_time_minutes: number | null
  published_at: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/blog/posts")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setPosts(data.posts || [])
      })
      .catch((err) => console.error("Failed to load blog posts:", err))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 text-ink-600 mb-3">
            <Newspaper className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Blog</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">The ClassHire Blog</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            News, updates, and stories from Nigeria&apos;s teaching community.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-ink-600 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-500 py-16">No posts yet — check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                {post.cover_image_url ? (
                  <img src={post.cover_image_url} alt={post.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-ink-50 to-blue-50 flex items-center justify-center">
                    <Newspaper className="h-8 w-8 text-ink-300" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h2>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(post.published_at)}</span>
                    {post.read_time_minutes && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time_minutes} min</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
