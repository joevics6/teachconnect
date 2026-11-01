import { renderIndex, XML_HEADERS } from "@/lib/sitemap"

// Sitemap index — lists the per-section sitemaps under /sitemaps/ and the
// numbered job sitemaps under /sitemaps/jobs/.
export async function GET() {
  return new Response(await renderIndex(), { headers: XML_HEADERS })
}
