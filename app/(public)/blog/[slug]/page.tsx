import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import { getPostBySlug, getPublishedPosts } from "@/lib/cache/blog"
import { absoluteUrl, LOGO_URL, oneLine, OG_IMAGE_URL, SITE_NAME, toJsonLdString, trimText } from "@/lib/site"

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: "Post not found", robots: { index: false, follow: false } }

  const description = trimText(oneLine(post.excerpt || post.body || post.title), 160)
  const url = absoluteUrl(`/blog/${post.slug}`)
  const image = post.cover_image_url || OG_IMAGE_URL

  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    keywords: post.tags?.length ? post.tags : undefined,
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", title: post.title, description, images: [image] },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const related = (await getPublishedPosts()).filter((p) => p.id !== post.id).slice(0, 3)
  const url = absoluteUrl(`/blog/${post.slug}`)

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: trimText(post.title, 110),
    description: oneLine(post.excerpt || ""),
    image: [post.cover_image_url || OG_IMAGE_URL],
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: post.author ? { "@type": "Person", name: post.author } : { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: LOGO_URL } },
    ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}),
  }
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(crumbLd) }} />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft className="h-4 w-4" />Back to Blog
        </Link>

        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt={post.title} className="w-full h-64 object-cover rounded-xl mb-6" />
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8">
          {post.author && (
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{post.author}</span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
          </span>
          {post.read_time_minutes && (
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.read_time_minutes} min read</span>
          )}
        </div>

        <article className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8">
          <p className="text-gray-600 text-lg mb-6 leading-relaxed">{post.excerpt}</p>
          {post.body && (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.body}
            </div>
          )}
        </article>

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
