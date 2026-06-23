"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  BookOpen,
  Download,
  Search,
  FileText,
  TrendingUp,
  GraduationCap,
  Building2,
  Star,
  ArrowRight,
  Loader2,
  Mail,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Types ───────────────────────────────────────────────────

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  cover_image_url: string | null
  published_at: string
}

interface Download {
  id: string
  title: string
  slug: string
  description: string
  category: string
  download_count: number
}

// ─── Constants ───────────────────────────────────────────────

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "Career Advice", label: "Career Advice" },
  { value: "School Management", label: "School Management" },
  { value: "TRCN Guide", label: "TRCN Guide" },
  { value: "Salary Insights", label: "Salary Insights" },
]

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Career Advice": TrendingUp,
  "School Management": Building2,
  "TRCN Guide": GraduationCap,
  "Salary Insights": Star,
}

const CATEGORY_COLORS: Record<string, string> = {
  "Career Advice": "bg-green-100 text-green-700",
  "School Management": "bg-blue-100 text-blue-700",
  "TRCN Guide": "bg-purple-100 text-purple-700",
  "Salary Insights": "bg-orange-100 text-orange-700",
}

// ─── Post Card ────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const CategoryIcon = CATEGORY_ICONS[post.category] || BookOpen
  const categoryColor = CATEGORY_COLORS[post.category] || "bg-gray-100 text-gray-600"

  return (
    <Link href={`/resources/${post.slug}`}>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-green-200 hover:shadow-md transition-all group">
        {/* Cover Image */}
        <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
          {post.cover_image_url ? (
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-gray-300" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
              <CategoryIcon className="h-3 w-3" />
              {post.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {new Date(post.published_at).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <span className="text-xs text-green-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Read more <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Download Card ────────────────────────────────────────────

function DownloadCard({ item }: { item: Download }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/resources/downloads/${item.slug}`)
      const data = await response.json()
      if (data.url) {
        window.open(data.url, "_blank")
        setDownloaded(true)
        setTimeout(() => setDownloaded(false), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <FileText className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">{item.description}</p>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Download className="h-3 w-3" />
              {item.download_count.toLocaleString()} downloads
            </span>
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className={`text-xs h-7 flex items-center gap-1.5 ${
                downloaded
                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isDownloading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : downloaded ? (
                <><CheckCircle2 className="h-3 w-3" />Downloaded</>
              ) : (
                <><Download className="h-3 w-3" />Download Free</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Newsletter Section ───────────────────────────────────────

function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address")
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) throw new Error("Failed to subscribe")
      setSubmitted(true)
    } catch {
      setError("Failed to subscribe. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mb-4">
        <Mail className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">
        Stay Updated on Teaching Jobs
      </h3>
      <p className="text-green-100 text-sm mb-6 max-w-md mx-auto">
        Get weekly updates on new job postings, salary guides, and career tips
        delivered to your inbox.
      </p>
      {submitted ? (
        <div className="flex items-center justify-center gap-2 text-white">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-medium">You&apos;re subscribed! Check your inbox.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-sm mx-auto flex-col sm:flex-row">
          <div className="flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError("") }}
              placeholder="Enter your email"
              className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white text-gray-900"
            />
            {error && <p className="text-red-200 text-xs mt-1">{error}</p>}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-white text-green-700 hover:bg-green-50 px-5 flex-shrink-0"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
          </Button>
        </form>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function ResourcesPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [downloads, setDownloads] = useState<Download[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [postsRes, downloadsRes] = await Promise.all([
          fetch("/api/resources/posts"),
          fetch("/api/resources/downloads"),
        ])
        const postsData = await postsRes.json()
        const downloadsData = await downloadsRes.json()
        setPosts(postsData.posts || [])
        setDownloads(downloadsData.downloads || [])
      } catch (err) {
        console.error("Failed to fetch resources:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchResources()
  }, [])

  const filteredPosts = posts.filter((p) => {
    const matchCategory = activeCategory === "all" || p.category === activeCategory
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const featuredPost = filteredPosts[0]
  const restPosts = filteredPosts.slice(1)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-white border-b border-gray-200 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Teaching Career Resources
          </h1>
          <p className="text-gray-500 mb-6">
            Guides, salary insights, and tools to help you advance your
            teaching career in Nigeria.
          </p>
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Downloads Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Download className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Free Downloads</h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : downloads.length === 0 ? (
            <p className="text-gray-500 text-sm">No downloads available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {downloads.map((item) => (
                <DownloadCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                activeCategory === cat.value
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Articles */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No articles found.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && !search && activeCategory === "all" && (
              <Link href={`/resources/${featuredPost.slug}`} className="block mb-8">
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-green-200 hover:shadow-md transition-all group">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="h-56 md:h-auto bg-gradient-to-br from-green-100 to-green-200 relative overflow-hidden">
                      {featuredPost.cover_image_url ? (
                        <img
                          src={featuredPost.cover_image_url}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-green-300" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                          Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col justify-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium w-fit mb-3 ${CATEGORY_COLORS[featuredPost.category] || "bg-gray-100 text-gray-600"}`}>
                        {featuredPost.category}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                        {featuredPost.title}
                      </h2>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {new Date(featuredPost.published_at).toLocaleDateString("en-NG", {
                            day: "numeric", month: "long", year: "numeric"
                          })}
                        </p>
                        <span className="text-sm text-green-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read more <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {(search || activeCategory !== "all" ? filteredPosts : restPosts).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}

        {/* Newsletter */}
        <NewsletterSection />

      </div>
    </div>
  )
}