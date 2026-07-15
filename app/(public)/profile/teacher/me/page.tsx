"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function TeacherMeRedirect() {
  const router = useRouter()

  useEffect(() => {
    fetch("/api/teacher/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile?.id) {
          router.replace(`/profile/teacher/${data.profile.id}`)
        } else {
          router.replace("/dashboard/teacher")
        }
      })
      .catch(() => router.replace("/dashboard/teacher"))
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-ink-600 animate-spin" />
    </div>
  )
}
