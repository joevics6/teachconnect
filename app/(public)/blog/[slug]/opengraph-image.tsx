import { getPostBySlug } from "@/lib/cache/blog"
import { ogCard, OG_SIZE } from "@/lib/og-card"

export const alt = "ClassHire blog"
export const size = OG_SIZE
export const contentType = "image/png"
export const revalidate = 3600

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return ogCard({ kicker: "Blog", title: "The ClassHire Blog" })
  return ogCard({
    kicker: "Blog",
    title: post.title,
    subtitle: post.author ? `By ${post.author}` : null,
    pills: [post.read_time_minutes ? `${post.read_time_minutes} min read` : null, ...(post.tags || []).slice(0, 2)],
  })
}
