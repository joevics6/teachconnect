"use client"

// ============================================================
// app/(dashboard)/dashboard/teacher/quiz-results/page.tsx
// ============================================================

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  PenLine,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const NAV_ITEMS = [
  { href: "/dashboard/teacher", label: "Overview", icon: GraduationCap },
  { href: "/dashboard/teacher/applications", label: "My Applications", icon: Briefcase },
  { href: "/dashboard/teacher/saved-jobs", label: "Saved Jobs", icon: BookOpen },
  { href: "/dashboard/teacher/quiz-results", label: "Quiz Results", icon: Star },
  { href: "/dashboard/teacher/specialization-quiz", label: "Subject Mastery", icon: Zap },
  { href: "/profile/teacher/me", label: "My Profile", icon: User },
  { href: "/dashboard/teacher/settings", label: "Settings", icon: Settings },
]

interface QuizResult {
  id: string
  job_id: string
  job_title: string
  school_name: string
  subject: string
  score: number
  passed: boolean
  mode: "standard" | "speed" | "written"
  time_taken_seconds: number
  written_feedback: WrittenFeedback[] | null
  created_at: string
}

interface WrittenFeedback {
  question: string
  answer: string
  score: number
  max_score: number
  feedback: string
}

function getModeIcon(mode: string) {
  if (mode === "speed") return Zap
  if (mode === "written") return PenLine
  return BookOpen
}

function getModeLabel(mode: string) {
  if (mode === "speed") return "Speed Quiz"
  if (mode === "written") return "Written Quiz"
  return "Standard Quiz"
}

function getModeColor(mode: string) {
  if (mode === "speed") return "text-orange-600 bg-orange-50 border-orange-200"
  if (mode === "written") return "text-purple-600 bg-purple-50 border-purple-200"
  return "text-blue-600 bg-blue-50 border-blue-200"
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function QuizResultCard({ result }: { result: QuizResult }) {
  const [showFeedback, setShowFeedback] = useState(false)
  const ModeIcon = getModeIcon(result.mode)
  const modeColor = getModeColor(result.mode)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm mb-0.5">{result.job_title}</h3>
          <p className="text-xs text-gray-500">{result.school_name}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${modeColor}`}>
            <ModeIcon className="h-3 w-3" />
            {getModeLabel(result.mode)}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
            result.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}>
            {result.passed
              ? <><CheckCircle2 className="h-3 w-3" />Passed</>
              : <><XCircle className="h-3 w-3" />Failed</>
            }
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className={`text-2xl font-black ${result.passed ? "text-green-600" : "text-red-500"}`}>
            {result.score}%
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Score</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-2xl font-black text-gray-900">{result.subject}</p>
          <p className="text-xs text-gray-500 mt-0.5">Subject</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-2xl font-black text-gray-900">
            {formatTime(result.time_taken_seconds)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Duration</p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-gray-400">
          Taken on {new Date(result.created_at).toLocaleDateString("en-NG", {
            day: "numeric", month: "long", year: "numeric"
          })}
        </p>
        <div className="flex items-center gap-2">
          {result.written_feedback && result.written_feedback.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              {showFeedback ? "Hide Feedback" : "View AI Feedback"}
            </Button>
          )}
          <Link href={`/jobs/${result.job_id}`}>
            <Button size="sm" variant="outline" className="text-xs h-7">View Job</Button>
          </Link>
        </div>
      </div>

      {/* Written Quiz Feedback */}
      {showFeedback && result.written_feedback && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <PenLine className="h-4 w-4 text-purple-600" />
            AI Feedback
          </h4>
          {result.written_feedback.map((fb, i) => (
            <div key={i} className="p-3 border border-gray-100 rounded-xl">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="text-xs font-medium text-gray-900">Q{i + 1}. {fb.question}</p>
                <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                  fb.score >= fb.max_score * 0.7 ? "bg-green-100 text-green-700"
                    : fb.score >= fb.max_score * 0.4 ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-600"
                }`}>
                  {fb.score}/{fb.max_score}
                </span>
              </div>
              <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mb-2 italic">Your answer: {fb.answer}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{fb.feedback}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function QuizResultsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [results, setResults] = useState<QuizResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch("/api/teacher/quiz-results")
        const data = await response.json()
        setResults(data.results || [])
      } catch (err) {
        console.error("Failed to fetch quiz results:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchResults()
  }, [])

  const passedCount = results.filter((r) => r.passed).length
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0
  const bestScore = results.length > 0 ? Math.max(...results.map((r) => r.score)) : 0

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-green-600 text-white p-1.5 rounded-lg"><GraduationCap className="h-4 w-4" /></div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-xs text-gray-900">JobMeter</span>
              <span className="font-bold text-xs text-green-600">TeachConnect</span>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><span className="text-green-700 font-bold text-sm">AO</span></div>
            <div><p className="font-semibold text-gray-900 text-sm">Adaeze Okafor</p><p className="text-xs text-gray-500">Mathematics • Lagos</p></div>
          </div>
        </div>
        <nav className="p-3">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition mb-0.5">
              <item.icon className="h-4 w-4 flex-shrink-0" />{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition w-full"><LogOut className="h-4 w-4" />Log Out</button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5 text-gray-600" /></button>
          <h1 className="text-lg font-bold text-gray-900">Quiz Results</h1>
        </header>

        <div className="p-6 space-y-5">
          {/* Stats */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Quizzes Taken", value: results.length, color: "text-blue-600", icon: BookOpen },
                { label: "Passed", value: passedCount, color: "text-green-600", icon: CheckCircle2 },
                { label: "Avg Score", value: `${avgScore}%`, color: "text-purple-600", icon: TrendingUp },
                { label: "Best Score", value: `${bestScore}%`, color: "text-orange-600", icon: Star },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Results List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No quiz results yet</h3>
              <p className="text-gray-500 text-sm mb-5">Apply for jobs with quiz screening to see your results here.</p>
              <Link href="/jobs"><Button className="bg-green-600 hover:bg-green-700 text-white">Browse Jobs</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => <QuizResultCard key={result.id} result={result} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}