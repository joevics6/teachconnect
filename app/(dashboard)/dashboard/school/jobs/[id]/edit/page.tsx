"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle2, Menu } from "lucide-react"
import { SchoolSidebar } from "@/components/dashboard/SchoolSidebar"
import { JobEditForm, type EditableJob } from "@/components/jobs/JobEditForm"
import { getFetchErrorMessage } from "@/lib/network-error"

export default function EditSchoolJobPage() {
  const params = useParams()
  const jobId = params.id as string

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [job, setJob] = useState<EditableJob | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/school/jobs/${jobId}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load job")
        setJob(data.job)
      })
      .catch((err) => setFetchError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Failed to load job")))
      .finally(() => setIsLoading(false))
  }, [jobId])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SchoolSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-64">
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)}><Menu className="h-6 w-6" /></button>
          <span className="font-bold text-gray-900">Edit Job</span>
          <div className="w-6" />
        </div>

        <div className="max-w-3xl mx-auto p-6">
          <Link href="/dashboard/school/jobs" className="text-sm text-gray-500 flex items-center gap-1 mb-4 hover:text-gray-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to My Jobs
          </Link>

          {saved ? (
            <div className="text-center py-20">
              <CheckCircle2 className="h-12 w-12 text-ink-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">Changes Saved</h1>
              <Link href="/dashboard/school/jobs" className="text-ink-600 font-medium text-sm underline">
                Back to My Jobs
              </Link>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : fetchError || !job ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500 text-sm">{fetchError || "Job not found"}</p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Job</h1>
              <JobEditForm
                job={job}
                submitUrl={`/api/school/jobs/${jobId}`}
                onSaved={() => setSaved(true)}
                cancelHref="/dashboard/school/jobs"
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
