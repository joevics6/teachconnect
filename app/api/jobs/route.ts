// ============================================================
// app/api/jobs/route.ts
// GET /api/jobs — fetch all jobs with filters
// Backed by lib/cache/jobs.ts — see that file for the caching/
// invalidation strategy.
// ============================================================

import { NextResponse } from "next/server"
import { getJobsSearch, getFeaturedJobs } from "@/lib/cache/jobs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      keyword: searchParams.get("keyword") || "",
      subject: searchParams.get("subject") || "",
      level: searchParams.get("level") || "",
      state: searchParams.get("state") || "",
      employment_type: searchParams.get("employment_type") || "",
      salary_min: searchParams.get("salary_min") || "",
      salary_max: searchParams.get("salary_max") || "",
      accommodation: searchParams.get("accommodation") === "true",
      sort: searchParams.get("sort") || "newest",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    }

    const { jobs, total } = await getJobsSearch(filters)

    // Featured jobs only on page 1 — separate cache entry, shared
    // across every filter combination since it never changes with them.
    const featured = filters.page === 1 ? await getFeaturedJobs() : []

    return NextResponse.json({
      jobs,
      featured,
      total,
      page: filters.page,
      limit: filters.limit,
    })
  } catch (err) {
    console.error("GET /api/jobs error:", err)
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    )
  }
}
