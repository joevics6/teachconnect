"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Zap,
  Clock,
  Trophy,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  GraduationCap,
  RotateCcw,
  TrendingUp,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SUBJECTS } from "@/lib/constants"

// ─── Types ────────────────────────────────────────────────────

interface QuizQuestion {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

interface QuizMeta {
  subject: string
  duration_minutes: number
  question_count: number
  questions: QuizQuestion[]
}

interface QuizResult {
  score: number
  correct: number
  total: number
  percentile: number
  time_taken_seconds: number
}

// ─── Helpers ─────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function getPercentileLabel(percentile: number) {
  if (percentile >= 95) return { label: "Top 5%", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" }
  if (percentile >= 90) return { label: "Top 10%", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" }
  if (percentile >= 75) return { label: "Top 25%", color: "text-green-600", bg: "bg-green-50 border-green-200" }
  if (percentile >= 50) return { label: "Above Average", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" }
  if (percentile >= 25) return { label: "Below Average", color: "text-gray-600", bg: "bg-gray-50 border-gray-200" }
  return { label: "Bottom 25%", color: "text-red-500", bg: "bg-red-50 border-red-200" }
}

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// ─── Subject Selection Screen ─────────────────────────────────

function SubjectSelectScreen({ onSelect }: { onSelect: (subject: string) => void }) {
  const [selected, setSelected] = useState("")

  // Only show subjects that are likely to have quiz questions
  const quizSubjects = SUBJECTS.filter((s) =>
    !["Nursery Activities", "Primary Activities"].includes(s)
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-4">
            <Zap className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Subject Mastery Quiz
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            A fast 5-minute quiz that measures your knowledge against other
            teachers. Your percentile rank will appear on your profile.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h2 className="text-sm font-bold text-gray-900 mb-3">How it works</h2>
          <div className="space-y-2.5">
            {[
              { icon: Clock, text: "30 questions · 5 minute time limit" },
              { icon: Zap, text: "Answer as fast as you can — speed matters" },
              { icon: TrendingUp, text: "Your score is compared to all other teachers" },
              { icon: Trophy, text: "Your percentile rank shows on your profile" },
              { icon: RotateCcw, text: "Retake every 30 days to improve your rank" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                <item.icon className="h-4 w-4 text-green-600 flex-shrink-0" />
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Subject selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Select your subject
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Choose a subject...</option>
            {quizSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold"
        >
          <Zap className="h-5 w-5 mr-2" />
          Start Quiz
        </Button>

        <Link
          href="/dashboard/teacher"
          className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-4"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

// ─── Already Attempted Screen ─────────────────────────────────

function AlreadyAttemptedScreen({
  subject,
  attempt,
  retakeAt,
  onChooseDifferent,
}: {
  subject: string
  attempt: { score: number; percentile: number }
  retakeAt: string
  onChooseDifferent: () => void
}) {
  const retakeDate = new Date(retakeAt)
  const canRetakeNow = new Date() >= retakeDate
  const percentileInfo = getPercentileLabel(attempt.percentile)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-5">
            <Trophy className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {subject} Quiz Result
          </h1>
          <p className="text-gray-500 text-sm mb-6">You have already taken this quiz recently</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-3xl font-black text-green-600">{attempt.score}%</p>
              <p className="text-xs text-gray-500 mt-1">Your Score</p>
            </div>
            <div className={`p-4 rounded-xl border ${percentileInfo.bg}`}>
              <p className={`text-3xl font-black ${percentileInfo.color}`}>
                {getOrdinal(attempt.percentile)}
              </p>
              <p className={`text-xs mt-1 ${percentileInfo.color}`}>Percentile</p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-6 ${percentileInfo.bg} ${percentileInfo.color}`}>
            <Award className="h-4 w-4" />
            {percentileInfo.label} of {subject} teachers
          </div>

          {canRetakeNow ? (
            <Button
              onClick={onChooseDifferent}
              className="w-full bg-green-600 hover:bg-green-700 text-white mb-3"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-sm text-amber-700">
              <Clock className="h-4 w-4 inline mr-1" />
              Retake available on{" "}
              {retakeDate.toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}

          <Button variant="outline" onClick={onChooseDifferent} className="w-full">
            Try a Different Subject
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Quiz Screen ──────────────────────────────────────────────

function QuizScreen({
  meta,
  onComplete,
}: {
  meta: QuizMeta
  onComplete: (result: QuizResult) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(meta.duration_minutes * 60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const startTime = useRef(Date.now())
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const current = meta.questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const timerPercent = (timeLeft / (meta.duration_minutes * 60)) * 100
  const isLowTime = timeLeft < 60

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    clearInterval(timerRef.current)

    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000)

    try {
      const response = await fetch("/api/teacher/specialization-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: meta.subject,
          answers,
          time_taken_seconds: timeTaken,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Submission failed")

      onComplete({
        score: data.score,
        correct: data.correct,
        total: data.total,
        percentile: data.percentile,
        time_taken_seconds: timeTaken,
      })
    } catch (err) {
      console.error("Quiz submit error:", err)
      setIsSubmitting(false)
    }
  }, [answers, isSubmitting, meta.subject, onComplete])

  // Countdown timer — auto-submit on expire
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [handleSubmit])

  const selectAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }))
    // Auto-advance immediately in speed mode
    if (currentIndex < meta.questions.length - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 200)
    }
  }

  const options = [
    { key: "a", label: current?.option_a },
    { key: "b", label: current?.option_b },
    { key: "c", label: current?.option_c },
    { key: "d", label: current?.option_d },
  ]

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Calculating your rank...</p>
          <p className="text-gray-400 text-sm mt-1">Comparing your score with other teachers</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded-lg border bg-green-50 border-green-200">
              <Zap className="h-4 w-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {meta.subject} — Subject Mastery
              </p>
              <p className="text-xs text-gray-500">
                {answeredCount} of {meta.questions.length} answered
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-sm font-bold flex-shrink-0 ${
              isLowTime
                ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                : "bg-gray-50 border-gray-200 text-gray-700"
            }`}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Timer bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-1000 ${
                isLowTime ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Question Card */}
        {current && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
            <div className="flex items-start gap-3 mb-6">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-700 text-sm font-bold flex items-center justify-center">
                {currentIndex + 1}
              </span>
              <p className="text-gray-900 font-medium leading-relaxed pt-1">
                {current.question_text}
              </p>
            </div>

            <div className="space-y-3">
              {options.map((opt) => {
                const isSelected = answers[current.id] === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => selectAnswer(current.id, opt.key)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-green-50 border-green-400 text-green-800"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold uppercase ${
                        isSelected
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 text-gray-400"
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-sm">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Prev
          </Button>

          <div className="text-xs text-gray-400">
            {currentIndex + 1} / {meta.questions.length}
          </div>

          {currentIndex < meta.questions.length - 1 ? (
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => Math.min(meta.questions.length - 1, i + 1))}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Submit
            </Button>
          )}
        </div>

        {/* Question dots navigator */}
        <div className="mt-6 flex flex-wrap gap-1.5 justify-center">
          {meta.questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                i === currentIndex
                  ? "bg-green-600 text-white"
                  : answers[q.id]
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Results Screen ───────────────────────────────────────────

function ResultsScreen({
  result,
  subject,
  onTakeAnother,
}: {
  result: QuizResult
  subject: string
  onTakeAnother: () => void
}) {
  const percentileInfo = getPercentileLabel(result.percentile)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-4">
        {/* Main result card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-5">
            <Trophy className="h-8 w-8 text-green-600" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {subject} Mastery Result
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Your result has been added to your profile
          </p>

          {/* Score & Percentile */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="text-4xl font-black text-green-600">{result.score}%</p>
              <p className="text-xs text-gray-500 mt-1">Score</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {result.correct}/{result.total} correct
              </p>
            </div>
            <div className={`p-4 rounded-2xl border ${percentileInfo.bg}`}>
              <p className={`text-4xl font-black ${percentileInfo.color}`}>
                {getOrdinal(result.percentile)}
              </p>
              <p className={`text-xs mt-1 ${percentileInfo.color}`}>Percentile</p>
              <p className={`text-xs mt-0.5 ${percentileInfo.color} opacity-70`}>
                {percentileInfo.label}
              </p>
            </div>
          </div>

          {/* Rank badge */}
          <div
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold mb-6 ${percentileInfo.bg} ${percentileInfo.color}`}
          >
            <Award className="h-4 w-4" />
            {percentileInfo.label} of {subject} Teachers
          </div>

          <p className="text-xs text-gray-400 mb-6">
            Time taken: {formatTime(result.time_taken_seconds)} • You can retake in 30 days
          </p>

          <div className="space-y-3">
            <Button
              onClick={onTakeAnother}
              variant="outline"
              className="w-full"
            >
              Try Another Subject
            </Button>
            <Link href="/profile/teacher/me">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                View My Profile
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard/teacher"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function SpecializationQuizPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [phase, setPhase] = useState<"select" | "loading" | "error" | "already-taken" | "quiz" | "results">("select")
  const [selectedSubject, setSelectedSubject] = useState("")
  const [meta, setMeta] = useState<QuizMeta | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [alreadyAttempt, setAlreadyAttempt] = useState<{ score: number; percentile: number } | null>(null)
  const [retakeAt, setRetakeAt] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Allow pre-selecting subject from URL param
  useEffect(() => {
    const subjectParam = searchParams.get("subject")
    if (subjectParam) {
      setSelectedSubject(subjectParam)
      loadQuiz(subjectParam)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadQuiz = async (subject: string) => {
    setPhase("loading")
    setSelectedSubject(subject)
    try {
      const response = await fetch(
        `/api/teacher/specialization-quiz?subject=${encodeURIComponent(subject)}`
      )
      const data = await response.json()

      if (response.status === 409) {
        setAlreadyAttempt(data.recent_attempt)
        setRetakeAt(data.retake_available_at)
        setPhase("already-taken")
        return
      }

      if (!response.ok) {
        setErrorMsg(data.error || "Failed to load quiz")
        setPhase("error")
        return
      }

      setMeta(data)
      setPhase("quiz")
    } catch {
      setErrorMsg("Failed to load quiz. Please try again.")
      setPhase("error")
    }
  }

  const handleComplete = (quizResult: QuizResult) => {
    setResult(quizResult)
    setPhase("results")
  }

  const handleReset = () => {
    setPhase("select")
    setSelectedSubject("")
    setMeta(null)
    setResult(null)
    setAlreadyAttempt(null)
    setRetakeAt("")
    setErrorMsg("")
    router.replace("/dashboard/teacher/specialization-quiz")
  }

  if (phase === "select") {
    return <SubjectSelectScreen onSelect={loadQuiz} />
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-4">
            <Loader2 className="h-7 w-7 text-green-600 animate-spin" />
          </div>
          <p className="text-gray-700 font-semibold">Loading {selectedSubject} quiz...</p>
        </div>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Couldn't Load Quiz</h2>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <Button onClick={handleReset} className="bg-green-600 hover:bg-green-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (phase === "already-taken" && alreadyAttempt) {
    return (
      <AlreadyAttemptedScreen
        subject={selectedSubject}
        attempt={alreadyAttempt}
        retakeAt={retakeAt}
        onChooseDifferent={handleReset}
      />
    )
  }

  if (phase === "results" && result) {
    return (
      <ResultsScreen
        result={result}
        subject={selectedSubject}
        onTakeAnother={handleReset}
      />
    )
  }

  if (phase === "quiz" && meta) {
    return <QuizScreen meta={meta} onComplete={handleComplete} />
  }

  return null
}
