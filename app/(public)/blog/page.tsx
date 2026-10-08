import type { Metadata } from "next"
import Link from "next/link"
import { Calendar, Clock, Newspaper } from "lucide-react"
import { getPublishedPosts } from "@/lib/cache/blog"
import { absoluteUrl, SITE_NAME, toJsonLdString } from "@/lib/site"

export const revalidate = 300

const TITLE = "Teaching Career Blog – Jobs, Tips & School News in Nigeria"
const DESCRIPTION =
  "Practical advice for Nigerian teachers and schools: finding teaching jobs, writing a teaching CV, TRCN registration, interview tips and hiring guides."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/blog"), siteName: SITE_NAME, type: "website" },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
}

export default async function BlogPage() {
  const posts = await getPublishedPosts()

  const listLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `The ${SITE_NAME} Blog`,
    url: absoluteUrl("/blog"),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/blog/${p.slug}`),
        name: p.title,
      })),
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(listLd) }} />
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center gap-2 text-ink-600 mb-3">
            <Newspaper className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Blog</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">The {SITE_NAME} Blog</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Teaching jobs, career advice and hiring guides for teachers and schools in Nigeria.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {posts.length === 0 ? (
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.cover_image_url} alt={post.title} loading="lazy" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-ink-50 to-ink-50 flex items-center justify-center">
                    <Newspaper className="h-8 w-8 text-ink-300" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h2>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                    </span>
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
