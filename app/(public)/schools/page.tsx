"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, School, MapPin, CheckCircle2, Loader2, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NIGERIAN_STATES } from "@/lib/constants"
import { getFetchErrorMessage } from "@/lib/network-error"

interface DirectorySchool {
  id: string
  school_name: string
  slug: string | null
  school_type: string
  state: string
  lga: string
  town: string | null
  logo_url: string | null
  is_verified: boolean
  about: string | null
}

const SCHOOL_TYPES = [
  { value: "", label: "All Types" },
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
  { value: "international", label: "International" },
  { value: "missionary", label: "Missionary" },
]

export default function SchoolsDirectoryPage() {
  const [schools, setSchools] = useState<DirectorySchool[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [state, setState] = useState("")
  const [schoolType, setSchoolType] = useState("")
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")

  const fetchSchools = useCallback(async () => {
    setIsLoading(true)
    setFetchError("")
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (state) params.set("state", state)
      if (schoolType) params.set("school_type", schoolType)
      params.set("page", String(page))

      const res = await fetch(`/api/schools?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to load schools")
      const data = await res.json()
      setSchools(data.schools || [])
      setTotal(data.total || 0)
    } catch (err) {
      setFetchError(getFetchErrorMessage(err, "Failed to load schools"))
    } finally {
      setIsLoading(false)
    }
  }, [search, state, schoolType, page])

  useEffect(() => {
    const t = setTimeout(fetchSchools, 300)
    return () => clearTimeout(t)
  }, [fetchSchools])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Schools on ClassHire</h1>
          <p className="text-gray-500 text-sm">Browse schools hiring directly — no agencies, no middlemen.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by school name"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
            />
          </div>
          <select
            value={state}
            onChange={(e) => { setState(e.target.value); setPage(1) }}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">All States</option>
            {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={schoolType}
            onChange={(e) => { setSchoolType(e.target.value); setPage(1) }}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
          >
            {SCHOOL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {!isLoading && !fetchError && (
          <p className="text-sm text-gray-500 mb-4">
            <span className="font-semibold text-gray-900">{total}</span> school{total !== 1 ? "s" : ""} found
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : fetchError ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="h-7 w-7 text-red-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-4">{fetchError}</p>
            <Button variant="outline" onClick={fetchSchools}>Try Again</Button>
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 text-sm">No schools found. Try adjusting your search.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {schools.map((school) => (
                <Link key={school.id} href={`/schools/${school.slug || school.id}`}>
                  <div className="bg-white border border-gray-200 rounded-xl p-5 h-full hover:border-ink-300 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {school.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={school.logo_url} alt={school.school_name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <School className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-gray-900 text-sm truncate">{school.school_name}</p>
                          {school.is_verified && <CheckCircle2 className="h-3.5 w-3.5 text-ink-600 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 capitalize">{school.school_type}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                      <MapPin className="h-3 w-3" />
                      {[school.town, school.lga, school.state].filter(Boolean).join(", ")}
                    </p>
                    {school.about && (
                      <p className="text-xs text-gray-400 line-clamp-2">{school.about}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
