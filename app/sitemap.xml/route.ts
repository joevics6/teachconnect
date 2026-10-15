import { renderIndex, XML_HEADERS } from "@/lib/sitemap"

// Sitemap index — lists the per-section sitemaps under /sitemaps/.
export function GET() {
  return new Response(renderIndex(), { headers: XML_HEADERS })
}
