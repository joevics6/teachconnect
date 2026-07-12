"use client"

import { useState, useEffect, useCallback } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SUBJECTS, TEACHING_LEVELS, NIGERIAN_STATES } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import type { Job } from "@/types"

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
  const daysLeft = Math.ceil(
    (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white border border-gray-100 rounded-xl p-5 hover:border-green-200 hover:shadow-sm transition-all group">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {job.school_logo_url ? (
                <img
                  src={job.school_logo_url}
                  alt={job.school_name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Briefcase className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-green-600 transition-colors">
                  {job.title}
                </p>
                {job.school_is_verified && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full flex-shrink-0">
                    <Star className="h-2.5 w-2.5" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{job.school_name}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {job.is_featured && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                Featured
              </span>
            )}
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                job.employment_type === "full-time"
                  ? "bg-green-50 text-green-700"
                  : job.employment_type === "part-time"
                  ? "bg-purple-50 text-purple-700"
                  : "bg-orange-50 text-orange-700"
              }`}
            >
              {job.employment_type}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
            {job.subject}
          </span>
          {job.teaching_levels.map((level) => (
            <span
              key={level}
              className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg capitalize"
            >
              {level.toUpperCase()}
            </span>
          ))}
          {job.quiz_enabled && (
            <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-xs rounded-lg flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Quiz Required
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.school_state}
            </span>
            {job.accommodation_offered && (
              <span className="flex items-center gap-1 text-green-600">
                <Home className="h-3 w-3" />
                Accommodation
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {daysLeft <= 0
                ? "Closed"
                : daysLeft === 1
                ? "Closes tomorrow"
                : `${daysLeft} days left`}
            </span>
          </div>
          <p className="text-sm font-bold text-gray-900">
            {formatCurrency(job.salary_min)} –{" "}
            {formatCurrency(job.salary_max)}
            <span className="text-xs font-normal text-gray-400">/mo</span>
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobWithSchool[]>([])
  const [featuredJobs, setFeaturedJobs] = useState<JobWithSchool[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
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
      const data = await response.json()

      if (currentPage === 1) {
        setFeaturedJobs(data.featured || [])
      }
      setJobs(data.jobs || [])
      setTotalCount(data.total || 0)
    } catch (err) {
      console.error("Failed to fetch jobs:", err)
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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All subjects</option>
                    {SUBJECTS.map((s) => (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Sort By
                  </label>
                  <select
                    value={filters.sort}
                    onChange={(e) => updateFilter("sort", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      className="w-4 h-4 rounded accent-green-600"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-5">
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
          {filters.accommodation && (
            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              <Home className="h-3 w-3" />
              Showing jobs with accommodation
            </span>
          )}
        </div>

        {/* Job List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse"
              >
                <div className="flex gap-3 mb-3">
                  <div className="w-11 h-11 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <div className="h-6 bg-gray-100 rounded-lg w-20" />
                  <div className="h-6 bg-gray-100 rounded-lg w-16" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-100 rounded w-32" />
                  <div className="h-4 bg-gray-200 rounded w-28" />
                </div>
              </div>
            ))}
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
          <div className="space-y-4">
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
                            ? "bg-green-600 text-white"
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