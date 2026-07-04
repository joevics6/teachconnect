// Server component — renders with full SEO metadata, JSON-LD schemas, breadcrumbs
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Clock, Tag, Eye, BookOpen, FileText, Play,
  ArrowLeft, Calendar, User,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import ResourceAccessPanel from "./ResourceAccessPanel"

// ─── Types ────────────────────────────────────────────────────

interface Resource {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  category: string
  resource_type: "article" | "pdf" | "document" | "video" | "youtube"
  cover_image_url: string | null
  file_url: string | null
  external_url: string | null
  youtube_id: string | null
  download_count: number
  read_time_minutes: number | null
  tags: string[]
  author: string | null
  published_at: string
  seo_title: string | null
  seo_description: string | null
}

// ─── Data fetching ────────────────────────────────────────────

async function getResource(slug: string): Promise<{ resource: Resource; related: Resource[] } | null> {
  const supabase = await createClient()

  const { data: resource, error } = await supabase
    .from("resource_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (error || !resource) return null

  const { data: related } = await supabase
    .from("resource_posts")
    .select("id, title, slug, category, resource_type, excerpt")
    .eq("category", resource.category)
    .eq("is_published", true)
    .neq("id", resource.id)
    .limit(4)

  return { resource, related: related || [] }
}

// ─── generateMetadata ─────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const data = await getResource(params.slug)
  if (!data) return { title: "Resource Not Found — TeachConnect" }

  const { resource } = data
  const title       = resource.seo_title || `${resource.title} — TeachConnect`
  const description = resource.seo_description || resource.excerpt
  const url         = `https://teachconnect.com.ng/resources/${resource.slug}`
  const image       = resource.cover_image_url || "https://teachconnect.com.ng/og-default.png"

  return {
    title,
    description,
    keywords: resource.tags?.join(", "),
    authors:  resource.author ? [{ name: resource.author }] : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: "TeachConnect Nigeria",
      images:   [{ url: image, width: 1200, height: 630, alt: resource.title }],
      type:     "article",
      publishedTime: resource.published_at,
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description,
      images:      [image],
    },
    alternates: { canonical: url },
  }
}

// ─── Constants ────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  "Career Advice":     "bg-green-100 text-green-700",
  "School Management": "bg-blue-100 text-blue-700",
  "TRCN Guide":        "bg-purple-100 text-purple-700",
  "Salary Insights":   "bg-orange-100 text-orange-700",
  "Curriculum Guide":  "bg-orange-100 text-orange-700",
}

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  article:  { icon: "📄", label: "Article",  color: "bg-gray-100 text-gray-600"      },
  pdf:      { icon: "📕", label: "PDF",       color: "bg-red-100 text-red-600"        },
  document: { icon: "📝", label: "Document",  color: "bg-blue-100 text-blue-600"      },
  video:    { icon: "🎬", label: "Video",     color: "bg-purple-100 text-purple-600"  },
  youtube:  { icon: "▶️", label: "Video",     color: "bg-red-100 text-red-600"        },
}

// ─── JSON-LD Schemas ──────────────────────────────────────────

function ArticleSchema({ resource }: { resource: Resource }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:       resource.title,
    description:    resource.seo_description || resource.excerpt,
    author: {
      "@type": "Person",
      name: resource.author || "TeachConnect Editorial",
    },
    publisher: {
      "@type": "Organization",
      name: "TeachConnect Nigeria",
      logo: {
        "@type": "ImageObject",
        url: "https://teachconnect.com.ng/logo.png",
      },
    },
    datePublished: resource.published_at,
    dateModified:  resource.published_at,
    image:         resource.cover_image_url || "https://teachconnect.com.ng/og-default.png",
    url:           `https://teachconnect.com.ng/resources/${resource.slug}`,
    keywords:      resource.tags?.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id":   `https://teachconnect.com.ng/resources/${resource.slug}`,
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function BreadcrumbSchema({ resource }: { resource: Resource }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",      item: "https://teachconnect.com.ng" },
      { "@type": "ListItem", position: 2, name: "Resources", item: "https://teachconnect.com.ng/resources" },
      { "@type": "ListItem", position: 3, name: resource.category, item: `https://teachconnect.com.ng/resources?category=${encodeURIComponent(resource.category)}` },
      { "@type": "ListItem", position: 4, name: resource.title, item: `https://teachconnect.com.ng/resources/${resource.slug}` },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

function FAQSchema({ resource }: { resource: Resource }) {
  // Only add FAQ schema for articles/curriculum guides with enough content
  if (!["article", "document"].includes(resource.resource_type)) return null
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is included in ${resource.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: resource.excerpt,
        },
      },
      {
        "@type": "Question",
        name: `Is ${resource.title} free to download?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. All resources on TeachConnect are free for Nigerian teachers to access and download.",
        },
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ─── Breadcrumb UI ────────────────────────────────────────────

function Breadcrumbs({ resource }: { resource: Resource }) {
  return (
    <nav aria-label="Breadcrumb" className="bg-white border-b border-gray-200 px-4 py-3">
      <ol className="max-w-4xl mx-auto flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <li>
          <Link href="/" className="hover:text-green-600 transition">Home</Link>
        </li>
        <li className="text-gray-300">/</li>
        <li>
          <Link href="/resources" className="hover:text-green-600 transition">Resources</Link>
        </li>
        <li className="text-gray-300">/</li>
        <li>
          <Link
            href={`/resources?category=${encodeURIComponent(resource.category)}`}
            className="hover:text-green-600 transition"
          >
            {resource.category}
          </Link>
        </li>
        <li className="text-gray-300">/</li>
        <li className="text-gray-900 font-medium truncate max-w-xs" aria-current="page">
          {resource.title}
        </li>
      </ol>
    </nav>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default async function ResourceDetailPage({ params }: { params: { slug: string } }) {
  const data = await getResource(params.slug)
  if (!data) notFound()

  const { resource, related } = data
  const typeMeta = TYPE_META[resource.resource_type] || TYPE_META.article
  const hasAccess = !!(resource.file_url || resource.external_url)
  const isYouTube = resource.resource_type === "youtube" || !!resource.youtube_id

  return (
    <>
      {/* JSON-LD Schemas injected into <head> via Next.js */}
      <ArticleSchema resource={resource} />
      <BreadcrumbSchema resource={resource} />
      <FAQSchema resource={resource} />

      {/* Breadcrumbs */}
      <Breadcrumbs resource={resource} />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Main Content ── */}
            <article className="lg:col-span-2">

              <Link
                href="/resources"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Resources
              </Link>

              {/* Cover */}
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
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${typeMeta.color}`}>
                  {typeMeta.icon} {typeMeta.label}
                </span>
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

              {/* Title — H1 for SEO */}
              <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                {resource.title}
              </h1>

              {/* Meta row */}
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 flex-wrap">
                {resource.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {resource.author}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <time dateTime={resource.published_at}>
                    {new Date(resource.published_at).toLocaleDateString("en-NG", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </time>
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {resource.download_count.toLocaleString()} {["pdf","document"].includes(resource.resource_type) ? "downloads" : "views"}
                </span>
              </div>

              {/* Excerpt / lede */}
              <p className="text-gray-700 text-base leading-relaxed mb-6 border-l-4 border-green-400 pl-4 italic">
                {resource.excerpt}
              </p>

              {/* YouTube Embed */}
              {isYouTube && resource.youtube_id && (
                <div className="aspect-video rounded-xl overflow-hidden bg-black mb-8">
                  <iframe
                    src={`https://www.youtube.com/embed/${resource.youtube_id}`}
                    title={resource.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* Body — full SEO content */}
              {resource.body && (
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-8
                    prose-h2:text-gray-900 prose-h2:font-bold prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3
                    prose-h3:text-gray-800 prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
                    prose-p:mb-4 prose-ul:mb-4 prose-ol:mb-4
                    prose-li:mb-1 prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: resource.body }}
                />
              )}

              {/* Tags */}
              {resource.tags?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-6 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">Tags:</span>
                  {resource.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>

            {/* ── Sidebar ── */}
            <aside className="space-y-4">

              {/* Access panel — client component for interactivity */}
              <ResourceAccessPanel
                slug={resource.slug}
                title={resource.title}
                resourceType={resource.resource_type}
                fileUrl={resource.file_url}
                externalUrl={resource.external_url}
                downloadCount={resource.download_count}
                hasAccess={hasAccess}
              />

              {/* Related */}
              {related.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="font-bold text-gray-900 mb-3 text-sm">Related Resources</h2>
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

              {/* Jobs CTA */}
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 text-white">
                <h3 className="font-bold mb-1 text-sm">Looking for teaching jobs?</h3>
                <p className="text-xs text-green-100 mb-3">
                  Browse hundreds of teaching roles across Nigeria.
                </p>
                <Link href="/jobs">
                  <span className="block w-full text-center bg-white text-green-700 hover:bg-green-50 text-xs font-semibold py-2 rounded-lg transition">
                    Browse Jobs
                  </span>
                </Link>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </>
  )
}
