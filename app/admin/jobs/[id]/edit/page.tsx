"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { AdminShell } from "@/components/admin/AdminShell"
import { JobEditForm, type EditableJob } from "@/components/jobs/JobEditForm"
import { getFetchErrorMessage } from "@/lib/network-error"

export default function EditAdminJobPage() {
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<EditableJob | null>(null)
  const [schoolName, setSchoolName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/jobs/${jobId}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to load job")
        setJob(data.job)
        setSchoolName(data.job.school_profiles?.school_name || "")
      })
      .catch((err) => setFetchError(getFetchErrorMessage(err, err instanceof Error ? err.message : "Failed to load job")))
      .finally(() => setIsLoading(false))
  }, [jobId])

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto p-6">
        <Link href="/admin/jobs" className="text-sm text-gray-500 flex items-center gap-1 mb-4 hover:text-gray-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Jobs
        </Link>

        {saved ? (
          <div className="text-center py-20">
            <CheckCircle2 className="h-12 w-12 text-ink-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Changes Saved</h1>
            <Link href="/admin/jobs" className="text-ink-600 font-medium text-sm underline">
              Back to Jobs
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
              submitUrl={`/api/admin/jobs/${jobId}`}
              schoolName={schoolName}
              onSaved={() => setSaved(true)}
              cancelHref="/admin/jobs"
            />
          </>
        )}
      </div>
    </AdminShell>
  )
}
