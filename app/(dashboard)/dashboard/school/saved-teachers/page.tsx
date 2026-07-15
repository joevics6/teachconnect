"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Star, Clock, MessageSquare, UserCheck,
  Loader2, User, MapPin, BookOpen, GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const FOLDERS = [
  { value: "",               label: "All Saved",         icon: Star       },
  { value: "excellent",      label: "Excellent",          icon: Star       },
  { value: "interview-later",label: "Interview Later",    icon: Clock      },
  { value: "contacted",      label: "Contacted",          icon: MessageSquare },
  { value: "hired",          label: "Hired",              icon: UserCheck  },
]

interface SavedTeacher {
  id: string
  folder: string
  notes: string | null
  created_at: string
  teacher_profiles: {
    id: string
    full_name: string
    state: string
    subjects: string[]
    teaching_levels: string[]
    years_experience: number
    trcn_status: string
    photo_url: string | null
    availability: string
    bio: string | null
  }
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function AvailabilityBadge({ value }: { value: string }) {
  const map: Record<string, { label: string; color: string }> = {
    "immediate":  { label: "Available Now",     color: "bg-ink-100 text-ink-700"  },
    "2-weeks":    { label: "2 Weeks",            color: "bg-blue-100 text-blue-700"    },
    "1-month":    { label: "1 Month",            color: "bg-yellow-100 text-yellow-700"},
    "employed":   { label: "Employed",           color: "bg-gray-100 text-gray-600"   },
    "part-time":  { label: "Part-time",          color: "bg-purple-100 text-purple-700"},
    "online":     { label: "Online Only",        color: "bg-indigo-100 text-indigo-700"},
    "weekend":    { label: "Weekends",           color: "bg-orange-100 text-orange-700"},
  }
  const v = map[value] || { label: value, color: "bg-gray-100 text-gray-600" }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.color}`}>{v.label}</span>
}

export default function SavedTeachersPage() {
  const router = useRouter()
  const [activeFolder, setActiveFolder] = useState("")
  const [saved, setSaved]               = useState<SavedTeacher[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    setLoading(true)
    const url = activeFolder
      ? `/api/school/saved-teachers?folder=${activeFolder}`
      : "/api/school/saved-teachers"

    fetch(url)
      .then(async (res) => {
        if (res.status === 401) { router.push("/login"); return }
        if (!res.ok) return
        const data = await res.json()
        setSaved(data.saved || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeFolder, router])

  const handleUnsave = async (teacherId: string) => {
    await fetch("/api/school/saved-teachers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: teacherId }),
    })
    setSaved((prev) => prev.filter((s) => s.teacher_profiles.id !== teacherId))
  }

  const handleMoveFolder = async (teacherId: string, folder: string) => {
    await fetch("/api/school/saved-teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: teacherId, folder }),
    })
    setSaved((prev) => prev.map((s) =>
      s.teacher_profiles.id === teacherId ? { ...s, folder } : s
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard/school">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Saved Teachers</h1>
          <span className="text-sm text-gray-400">({saved.length})</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Folder tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {FOLDERS.map((f) => (
            <button key={f.value}
              onClick={() => setActiveFolder(f.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                activeFolder === f.value
                  ? "bg-blue-700 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
              }`}>
              <f.icon className="h-3.5 w-3.5" />{f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-16">
            <Star className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-700 mb-1">No saved teachers</p>
            <p className="text-sm text-gray-400 mb-4">
              Browse teachers and click &quot;Save Teacher&quot; on their profile.
            </p>
            <Link href="/talent">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white">Browse Teachers</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map((item) => {
              const t = item.teacher_profiles
              return (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {t.photo_url
                          ? <img src={t.photo_url} alt={t.full_name} className="w-full h-full object-cover" />
                          : <span className="text-ink-700 font-bold text-sm">{getInitials(t.full_name)}</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900">{t.full_name}</h3>
                          {t.trcn_status === "registered" && (
                            <span className="text-xs bg-ink-100 text-ink-700 px-2 py-0.5 rounded-full font-medium">TRCN</span>
                          )}
                          <AvailabilityBadge value={t.availability} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          {t.state && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.state}</span>}
                          {t.years_experience > 0 && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{t.years_experience} yrs</span>}
                          {t.subjects?.length > 0 && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{t.subjects.slice(0, 2).join(", ")}</span>}
                        </div>
                        {t.bio && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{t.bio}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Link href={`/profile/teacher/${t.id}`}>
                        <Button size="sm" className="bg-blue-700 hover:bg-blue-800 text-white text-xs w-full">
                          <User className="h-3 w-3 mr-1" />View
                        </Button>
                      </Link>
                      <select
                        value={item.folder}
                        onChange={(e) => handleMoveFolder(t.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="interview-later">Interview Later</option>
                        <option value="contacted">Contacted</option>
                        <option value="hired">Hired</option>
                      </select>
                      <button onClick={() => handleUnsave(t.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition text-center">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
