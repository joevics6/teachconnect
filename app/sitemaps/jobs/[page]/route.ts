import { jobSitemapResponse } from "@/lib/sitemap"

// /sitemaps/jobs/1, /sitemaps/jobs/2, ... — 1,000 jobs per file.
export async function GET(_req: Request, { params }: { params: Promise<{ page: string }> }) {
  return jobSitemapResponse((await params).page)
}
