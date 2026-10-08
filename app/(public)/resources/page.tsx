import type { Metadata } from "next"
import { getResourceDownloads, getResourcePosts } from "@/lib/cache/resources"
import { absoluteUrl, SITE_NAME, toJsonLdString } from "@/lib/site"
import ResourcesClient, { type Download, type Post } from "./ResourcesClient"

export const revalidate = 300

const TITLE = "Teaching Career Resources – TRCN Guides, Salaries & Free Downloads"
const DESCRIPTION =
  "Free resources for Nigerian teachers and schools: TRCN registration guides, teacher salary insights, curriculum guides, CV and interview tips, and downloadable templates."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/resources" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/resources"), siteName: SITE_NAME, type: "website" },
}

export default async function ResourcesPage() {
  let posts: Post[] | undefined
  let downloads: Download[] | undefined
  try {
    const [p, d] = await Promise.all([getResourcePosts(), getResourceDownloads()])
    // Both empty may just mean the anon role can't read the tables; let
    // the client fetch (as before) rather than show an empty page.
    if (p.length > 0 || d.length > 0) {
      posts = p as Post[]
      downloads = d as Download[]
    }
  } catch (err) {
    // Fall back to the client-side fetch rather than failing the page.
    console.error("Resources page: server fetch failed:", err)
  }

  const listLd = posts?.length
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Teaching Career Resources",
        url: absoluteUrl("/resources"),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: posts.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(`/resources/${p.slug}`),
            name: p.title,
          })),
        },
      }
    : null

  return (
    <>
      {listLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(listLd) }} />}
      <ResourcesClient initialPosts={posts} initialDownloads={downloads} />
    </>
  )
}
