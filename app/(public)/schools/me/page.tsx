"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function SchoolMeRedirect() {
  const router = useRouter()

  useEffect(() => {
    fetch("/api/school/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.school?.id) {
          router.replace(`/schools/${data.school.id}`)
        } else {
          router.replace("/dashboard/school")
        }
      })
      .catch(() => router.replace("/dashboard/school"))
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-ink-600 animate-spin" />
    </div>
  )
}
