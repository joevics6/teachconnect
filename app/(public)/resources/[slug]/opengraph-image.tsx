import { createPublicClient } from "@/lib/supabase/public"
import { ogCard, OG_SIZE } from "@/lib/og-card"

export const alt = "Teaching resource on ClassHire"
export const size = OG_SIZE
export const contentType = "image/png"
export const revalidate = 3600

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data } = await createPublicClient()
    .from("resource_posts")
    .select("title, category, read_time_minutes")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()

  if (!data) return ogCard({ kicker: "Resource", title: "Teaching career resources" })
  return ogCard({
    kicker: data.category || "Resource",
    title: data.title,
    subtitle: "Free teaching career guide for Nigeria",
    pills: [data.read_time_minutes ? `${data.read_time_minutes} min read` : null],
  })
}
