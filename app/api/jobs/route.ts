// ============================================================
// app/api/jobs/route.ts
// GET /api/jobs — fetch all jobs with filters
// ============================================================
 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
 
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
 
    const keyword = searchParams.get("keyword") || ""
    const subject = searchParams.get("subject") || ""
    const level = searchParams.get("level") || ""
    const state = searchParams.get("state") || ""
    const employment_type = searchParams.get("employment_type") || ""
    const salary_min = searchParams.get("salary_min") || ""
    const salary_max = searchParams.get("salary_max") || ""
    const accommodation = searchParams.get("accommodation") === "true"
    const sort = searchParams.get("sort") || "newest"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit
 
    // Build base query using the jobs_with_school view
    let query = supabase
      .from("jobs_with_school")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .eq("is_private", false)
      .gte("deadline", new Date().toISOString().split("T")[0])
 
    // Keyword search across title and school name
    if (keyword) {
      query = query.or(
        `title.ilike.%${keyword}%,subject.ilike.%${keyword}%,school_name.ilike.%${keyword}%`
      )
    }
 
    // Subject filter
    if (subject) {
      query = query.eq("subject", subject)
    }
 
    // Level filter — check if level is in teaching_levels array
    if (level) {
      query = query.contains("teaching_levels", [level])
    }
 
    // State filter — matches the school state
    if (state) {
      query = query.eq("school_state", state)
    }
 
    // Employment type filter
    if (employment_type) {
      query = query.eq("employment_type", employment_type)
    }
 
    // Salary filters
    if (salary_min) {
      query = query.gte("salary_max", parseInt(salary_min))
    }
    if (salary_max) {
      query = query.lte("salary_min", parseInt(salary_max))
    }
 
    // Accommodation filter
    if (accommodation) {
      query = query.eq("accommodation_offered", true)
    }
 
    // Sort
    switch (sort) {
      case "salary_high":
        query = query.order("salary_max", { ascending: false })
        break
      case "deadline":
        query = query.order("deadline", { ascending: true })
        break
      default:
        query = query.order("created_at", { ascending: false })
    }
 
    // Pagination — non-featured jobs only
    const { data: jobs, count, error } = await query
      .eq("is_featured", false)
      .range(offset, offset + limit - 1)
 
    if (error) throw error
 
    // Fetch featured jobs separately (only on page 1)
    let featured = []
    if (page === 1) {
      const { data: featuredData } = await supabase
        .from("jobs_with_school")
        .select("*")
        .eq("status", "active")
        .eq("is_private", false)
        .eq("is_featured", true)
        .gte("deadline", new Date().toISOString().split("T")[0])
        .order("created_at", { ascending: false })
        .limit(4)
 
      featured = featuredData || []
    }
 
    return NextResponse.json({
      jobs: jobs || [],
      featured,
      total: count || 0,
      page,
      limit,
    })
  } catch (err) {
    console.error("GET /api/jobs error:", err)
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    )
  }
}