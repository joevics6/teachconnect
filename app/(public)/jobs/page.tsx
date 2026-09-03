"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Home,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  SlidersHorizontal,
  BookOpen,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ALL_SUBJECTS, TEACHING_LEVELS, NIGERIAN_STATES, getSubjectsForLevel } from "@/lib/constants"
import type { TeachingLevel } from "@/types"
import { formatSalaryRange } from "@/lib/utils"
import type { Job } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { getFetchErrorMessage } from "@/lib/network-error"

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "salary_high", label: "Highest Salary" },
  { value: "deadline", label: "Closing Soon" },
]

const JOBS_PER_PAGE = 20

interface Filters {
  keyword: string
  subject: string
  level: string
  state: string
  employment_type: string
  salary_min: string
  salary_max: string
  accommodation: boolean
  sort: string
}

interface JobWithSchool extends Job {
  school_name: string
  school_type: string
  school_state: string
  school_logo_url: string | null
  school_is_verified: boolean
}

function JobCard({ job }: { job: JobWithSchool }) {
  // eslint-disable-next-line react-hooks/purity -- display-only "days left" countdown; doesn't need certified determinism across renders
  const nowMs = useMemo(() => Date.now(), [])
  const daysLeft = Math.ceil(
    (new Date(job.deadline).getTime() - nowMs) / (1000 * 60 * 60 * 24)
  )
  const isClosed = daysLeft <= 0

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-ink-300 hover:shadow-lg transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {job.school_logo_url ? (
                <img
                  src={job.school_logo_url}
                  alt={job.school_name}
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <Briefcase className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-gray-900 text-base truncate group-hover:text-ink-600 transition-colors">
                  {job.title}
                </p>
                {job.school_is_verified && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-ink-50 text-ink-600 text-xs rounded-full flex-shrink-0">
                    <Star className="h-2.5 w-2.5" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 truncate">{job.school_name}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {job.is_featured && (
              <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold">
                Featured
              </span>
            )}
            <span
              className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                job.employment_type === "full-time"
                  ? "bg-ink-50 text-ink-700"
                  : job.employment_type === "part-time"
                  ? "bg-purple-50 text-purple-700"
                  : "bg-orange-50 text-orange-700"
              }`}
            >
              {job.employment_type}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
            {job.subject}
          </span>
          {job.teaching_levels.map((level) => (
            <span
              key={level}
              className="px-3 py-1.5 bg-ink-50 text-ink-600 text-xs font-medium rounded-lg capitalize"
            >
              {level.toUpperCase()}
            </span>
          ))}
          {job.quiz_enabled && (
            <span className="px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-medium rounded-lg flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Quiz Required
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 flex-wrap">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {job.school_state}
          </span>
          {job.accommodation_offered && (
            <span className="flex items-center gap-1.5 text-ink-600">
              <Home className="h-4 w-4" />
              Accommodation
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {isClosed
              ? "Closed"
              : daysLeft === 1
              ? "Closes tomorrow"
              : `${daysLeft} days left`}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <p className="text-lg font-bold text-gray-900">
            {formatSalaryRange(job.salary_min, job.salary_max)}
            {(job.salary_min || job.salary_max) && (
              <span className="text-sm font-normal text-gray-400">/mo</span>
            )}
          </p>
          <span
            className={`inline-flex items-center justify-center rounded-md px-5 h-10 text-sm font-medium transition-colors ${
              isClosed
                ? "bg-gray-100 text-gray-400"
                : "bg-ink-600 text-white group-hover:bg-ink-700"
            }`}
          >
            {isClosed ? "Closed" : "Apply Now"}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function JobsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [jobs, setJobs] = useState<JobWithSchool[]>([])
  const [featuredJobs, setFeaturedJobs] = useState<JobWithSchool[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState<Filters>({
    keyword: "",
    subject: "",
    level: "",
    state: "",
    employment_type: "",
    salary_min: "",
    salary_max: "",
    accommodation: false,
    sort: "newest",
  })

  const updateFilter = (key: keyof Filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      keyword: "",
      subject: "",
      level: "",
      state: "",
      employment_type: "",
      salary_min: "",
      salary_max: "",
      accommodation: false,
      sort: "newest",
    })
    setCurrentPage(1)
  }

  const activeFilterCount = [
    filters.subject,
    filters.level,
    filters.state,
    filters.employment_type,
    filters.salary_min,
    filters.salary_max,
    filters.accommodation,
  ].filter(Boolean).length

  const fetchJobs = useCallback(async () => {
    setIsLoading(true)
    setFetchError("")
    try {
      const params = new URLSearchParams()
      if (filters.keyword) params.set("keyword", filters.keyword)
      if (filters.subject) params.set("subject", filters.subject)
      if (filters.level) params.set("level", filters.level)
      if (filters.state) params.set("state", filters.state)
      if (filters.employment_type)
        params.set("employment_type", filters.employment_type)
      if (filters.salary_min) params.set("salary_min", filters.salary_min)
      if (filters.salary_max) params.set("salary_max", filters.salary_max)
      if (filters.accommodation) params.set("accommodation", "true")
      params.set("sort", filters.sort)
      params.set("page", String(currentPage))
      params.set("limit", String(JOBS_PER_PAGE))

      const response = await fetch(`/api/jobs?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to load jobs. Please try again.")
      const data = await response.json()

      if (currentPage === 1) {
        setFeaturedJobs(data.featured || [])
      }
      setJobs(data.jobs || [])
      setTotalCount(data.total || 0)
    } catch (err) {
      console.error("Failed to fetch jobs:", err)
      setJobs([])
      setTotalCount(0)
      setFetchError(getFetchErrorMessage(err, "Failed to load jobs. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }, [filters, currentPage])

  useEffect(() => {
    const timer = setTimeout(fetchJobs, 300)
    return () => clearTimeout(timer)
  }, [fetchJobs])

  const totalPages = Math.ceil(totalCount / JOBS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Teaching Jobs in Nigeria
          </h1>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => updateFilter("keyword", e.target.value)}
                placeholder="Search by job title, subject, or school..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink-500 focus:border-transparent"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-ink-600 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Subject
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => updateFilter("subject", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ink-500"
                  >
                    <option value="">All subjects</option>
                    {(filters.level ? getSubjectsForLevel(filters.level as TeachingLevel) : ALL_SUBJECTS).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Level
                  </label>
                  <select
                    value={filters.level}
                    onChange={(e) => updateFilter("level", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ink-500"
                  >
                    <option value="">All levels</option>
                    {TEACHING_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    State
                  </label>
                  <select
                    value={filters.state}
                    onChange={(e) => updateFilter("state", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ink-500"
                  >
                    <option value="">All states</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={filters.employment_type}
                    onChange={(e) =>
                      updateFilter("employment_type", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ink-500"
                  >
                    <option value="">All types</option>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Min Salary (₦)
                  </label>
                  <input
                    type="number"
                    value={filters.salary_min}
                    onChange={(e) => updateFilter("salary_min", e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Max Salary (₦)
                  </label>
                  <input
                    type="number"
                    value={filters.salary_max}
                    onChange={(e) => updateFilter("salary_max", e.target.value)}
                    placeholder="e.g. 200000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Sort By
                  </label>
                  <select
                    value={filters.sort}
                    onChange={(e) => updateFilter("sort", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ink-500"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.accommodation}
                      onChange={(e) =>
                        updateFilter("accommodation", e.target.checked)
                      }
                      className="w-4 h-4 rounded accent-ink-600"
                    />
                    <span className="text-sm text-gray-700">
                      Accommodation included
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Featured Jobs */}
        {currentPage === 1 && featuredJobs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-yellow-500" />
              <h2 className="font-bold text-gray-900">Featured Jobs</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <p className="text-sm text-gray-500">
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <span className="font-semibold text-gray-900">
                  {totalCount}
                </span>{" "}
                teaching job{totalCount !== 1 ? "s" : ""} found
                {filters.keyword && (
                  <> for &quot;{filters.keyword}&quot;</>
                )}
              </>
            )}
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            {filters.accommodation && (
              <span className="flex items-center gap-1 px-3 py-1 bg-ink-100 text-ink-700 text-xs rounded-full font-medium">
                <Home className="h-3 w-3" />
                Showing jobs with accommodation
              </span>
            )}
            {!authLoading && !user && (
              <Link href="/login">
                <Button size="sm" variant="outline" className="text-xs border-ink-300 text-ink-700">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Job List */}
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse"
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="flex gap-2 mb-5">
                  <div className="h-7 bg-gray-100 rounded-lg w-20" />
                  <div className="h-7 bg-gray-100 rounded-lg w-16" />
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <div className="h-5 bg-gray-200 rounded w-32" />
                  <div className="h-10 bg-gray-100 rounded-md w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="h-7 w-7 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {fetchError}
            </h3>
            <Button variant="outline" onClick={fetchJobs}>
              Try Again
            </Button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No jobs found
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Try adjusting your filters or search term
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {(() => {
                const windowSize = 5
                let start = Math.max(1, currentPage - Math.floor(windowSize / 2))
                const end = Math.min(totalPages, start + windowSize - 1)
                start = Math.max(1, end - windowSize + 1)
                const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)
                return (
                  <>
                    {start > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          className="w-9 h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                        >
                          1
                        </button>
                        <span className="text-gray-400 text-sm">…</span>
                      </>
                    )}
                    {pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          currentPage === page
                            ? "bg-ink-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    {end < totalPages && (
                      <>
                        <span className="text-gray-400 text-sm">…</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-9 h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </>
                )
              })()}
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}