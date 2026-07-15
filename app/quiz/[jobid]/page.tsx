"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Zap,
  PenLine,
  Send,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// ─── Types ───────────────────────────────────────────────────

type QuizMode = "speed" | "standard" | "written"

interface QuizQuestion {
  id: string
  subject?: string
  question_text: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct_option?: "a" | "b" | "c" | "d"
}

interface QuizMeta {
  job_id: string
  job_title: string
  school_name: string
  subject: string
  subjects?: string[]
  mode: QuizMode
  duration_minutes: number
  question_count: number
  pass_mark: number
  questions: QuizQuestion[]
}

interface WrittenFeedback {
  question: string
  answer: string
  score: number
  max_score: number
  feedback: string
}

interface QuizResult {
  score: number
  passed: boolean
  time_taken: number
  correct: number
  total: number
  written_feedback?: WrittenFeedback[]
}

// ─── Helpers ─────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function getModeIcon(mode: QuizMode) {
  if (mode === "speed") return Zap
  if (mode === "written") return PenLine
  return BookOpen
}

function getModeLabel(mode: QuizMode) {
  if (mode === "speed") return "Speed Quiz"
  if (mode === "written") return "Written Quiz"
  return "Standard Quiz"
}

function getModeColor(mode: QuizMode) {
  if (mode === "speed") return "text-orange-600 bg-orange-50 border-orange-200"
  if (mode === "written") return "text-purple-600 bg-purple-50 border-purple-200"
  return "text-blue-600 bg-blue-50 border-blue-200"
}

function subjectLabel(meta: { subject: string; subjects?: string[] }) {
  return meta.subjects?.length ? meta.subjects.join(" + ") : meta.subject
}

// ─── Pre-Quiz Screen ─────────────────────────────────────────

function PreQuizScreen({
  meta,
  onStart,
}: {
  meta: QuizMeta
  onStart: () => void
}) {
  const ModeIcon = getModeIcon(meta.mode)
  const modeColor = getModeColor(meta.mode)

  const modeDescriptions: Record<QuizMode, string> = {
    speed: `Answer as many questions as you can in ${meta.duration_minutes} minutes. Questions are multiple choice. Your score is based on how many you answer correctly before time runs out.`,
    standard: `Answer all ${meta.question_count} questions within ${meta.duration_minutes} minutes. All questions are multiple choice. You must complete all questions before submitting.`,
    written: `Answer ${meta.question_count} open-ended questions in your own words. There is no time limit. When you submit, your answers will be graded by AI with individual feedback per question.`,
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

          {/* Mode Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border mb-6 ${modeColor}`}>
            <ModeIcon className="h-4 w-4" />
            {getModeLabel(meta.mode)}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {subjectLabel(meta)} Quiz
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {meta.job_title} • {meta.school_name}
          </p>

          {/* Quiz Details */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
            {meta.mode !== "written" && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time Limit</span>
                <span className="font-semibold text-gray-900">
                  {meta.duration_minutes} minutes
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Questions</span>
              <span className="font-semibold text-gray-900">
                {meta.mode === "speed"
                  ? "As many as possible"
                  : meta.question_count}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pass Mark</span>
              <span className="font-semibold text-gray-900">
                {meta.pass_mark}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Question Type</span>
              <span className="font-semibold text-gray-900">
                {meta.mode === "written"
                  ? "Open-ended (AI graded)"
                  : "Multiple choice"}
              </span>
            </div>
            {meta.mode === "written" && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time Limit</span>
                <span className="font-semibold text-ink-600">
                  No time limit
                </span>
              </div>
            )}
          </div>

          {/* Mode Description */}
          <div className={`p-4 rounded-xl border text-sm mb-6 ${modeColor}`}>
            {modeDescriptions[meta.mode]}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">
              You can only attempt this quiz once for this job application.
              Make sure you are ready before starting.
            </p>
          </div>

          <Button
            onClick={onStart}
            className="w-full bg-ink-600 hover:bg-ink-700 text-white py-3 text-base"
          >
            Start Quiz
          </Button>

          <Link
            href={`/jobs/${meta.job_id}`}
            className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-4"
          >
            Go back to job listing
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Speed & Standard Quiz (MCQ) ─────────────────────────────

function MCQQuiz({
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

  const questions = meta.questions
  const current = questions[currentIndex]
  const totalQuestions = meta.mode === "speed" ? questions.length : meta.question_count
  const answeredCount = Object.keys(answers).length

  const handleSubmit = useCallback(async (auto = false) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000)
    const attempted = Object.keys(answers).length

    // Note: the client never receives correct_option (stripped server-side
    // for security), so scoring happens authoritatively in the API response
    // below — this local pass is just to shape the request, not to grade.
    let score = 0
    let passed = false
    let correct = 0

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: meta.job_id,
          mode: meta.mode,
          subjects: meta.subjects?.length ? meta.subjects : [meta.subject],
          answers,
          time_taken: timeTaken,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        score = data.score ?? 0
        passed = data.passed ?? false
        // Back out an approximate correct count for the results screen —
        // the authoritative number lives server-side; this is display-only.
        correct = meta.mode === "speed"
          ? Math.round((score / 100) * attempted)
          : Math.round((score / 100) * totalQuestions)
      }
    } catch (err) {
      console.error("Failed to submit quiz:", err)
    }

    onComplete({
      score,
      passed,
      time_taken: timeTaken,
      correct,
      total: meta.mode === "speed" ? attempted : totalQuestions,
    })
  }, [answers, isSubmitting, meta, totalQuestions, onComplete])

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [handleSubmit])

  const selectAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }))

    // Auto-advance in speed mode
    if (meta.mode === "speed" && currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 300)
    }
  }

  const timerPercent = (timeLeft / (meta.duration_minutes * 60)) * 100
  const isLowTime = timeLeft < 60

  const options = [
    { key: "a", label: current?.option_a },
    { key: "b", label: current?.option_b },
    { key: "c", label: current?.option_c },
    { key: "d", label: current?.option_d },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">

          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-1.5 rounded-lg border ${getModeColor(meta.mode)}`}>
              {meta.mode === "speed" ? (
                <Zap className="h-4 w-4" />
              ) : (
                <BookOpen className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {subjectLabel(meta)} — {getModeLabel(meta.mode)}
              </p>
              <p className="text-xs text-gray-500">
                {meta.mode === "speed"
                  ? `${answeredCount} answered`
                  : `Question ${currentIndex + 1} of ${totalQuestions}`}
              </p>
            </div>
          </div>

          {/* Timer */}
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

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-1000 ${
                isLowTime ? "bg-red-500" : "bg-ink-500"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Question Navigator (standard mode) */}
        {meta.mode === "standard" && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {questions.slice(0, totalQuestions).map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                  i === currentIndex
                    ? "bg-ink-600 text-white"
                    : answers[q.id]
                    ? "bg-ink-100 text-ink-700"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Question Card */}
        {current && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
            <div className="flex items-start gap-3 mb-6">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-ink-100 text-ink-700 text-sm font-bold flex items-center justify-center">
                {currentIndex + 1}
              </span>
              <div className="pt-1">
                {(meta.subjects?.length ?? 0) > 1 && current.subject && (
                  <span className="inline-block text-xs font-medium text-ink-700 bg-ink-50 border border-ink-200 rounded-full px-2 py-0.5 mb-1.5">
                    {current.subject}
                  </span>
                )}
                <p className="text-gray-900 font-medium leading-relaxed">
                  {current.question_text}
                </p>
              </div>
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
                        ? "bg-ink-50 border-ink-400 text-ink-800"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold uppercase ${
                        isSelected
                          ? "border-ink-500 bg-ink-500 text-white"
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
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-xs text-gray-400">
            {answeredCount} / {meta.mode === "speed" ? questions.length : totalQuestions} answered
          </div>

          {currentIndex < questions.length - 1 ? (
            <Button
              variant="outline"
              onClick={() =>
                setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
              }
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="bg-ink-600 hover:bg-ink-700 text-white flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Quiz
                </>
              )}
            </Button>
          )}
        </div>

        {/* Submit early button for standard mode */}
        {meta.mode === "standard" && currentIndex < questions.length - 1 && answeredCount === totalQuestions && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="bg-ink-600 hover:bg-ink-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Submit All Answers
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Written Quiz (AI Graded) ─────────────────────────────────

function WrittenQuiz({
  meta,
  onComplete,
}: {
  meta: QuizMeta
  onComplete: (result: QuizResult) => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [gradingProgress, setGradingProgress] = useState("")
  const startTime = useRef(Date.now())

  const questions = meta.questions.slice(0, meta.question_count)
  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length
  const allAnswered = answeredCount === questions.length

  const handleSubmit = async () => {
    if (!allAnswered) {
      setSubmitError("Please answer all questions before submitting.")
      return
    }
    setIsSubmitting(true)
    setSubmitError("")
    setGradingProgress("Sending answers to AI for grading...")

    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000)

    try {
      setGradingProgress("AI is reading your answers...")

      const response = await fetch("/api/quiz/grade-written", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: meta.job_id,
          subject: meta.subject,
          questions: questions.map((q) => ({
            id: q.id,
            subject: q.subject,
            question: q.question_text,
            answer: answers[q.id] || "",
          })),
        }),
      })

      if (!response.ok) throw new Error("Grading failed")

      setGradingProgress("Calculating your score...")
      const data = await response.json()

      const score = data.total_score
      const passed = score >= meta.pass_mark

      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: meta.job_id,
          mode: "written",
          subjects: meta.subjects?.length ? meta.subjects : [meta.subject],
          answers,
          score,
          passed,
          time_taken: timeTaken,
          written_feedback: data.feedback,
        }),
      })

      onComplete({
        score,
        passed,
        time_taken: timeTaken,
        correct: data.feedback.filter((f: WrittenFeedback) => f.score >= f.max_score * 0.5).length,
        total: questions.length,
        written_feedback: data.feedback,
      })
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Grading failed. Please try again."
      )
      setIsSubmitting(false)
      setGradingProgress("")
    }
  }

  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Grading your answers
          </h2>
          <p className="text-gray-500 text-sm">{gradingProgress}</p>
          <p className="text-xs text-gray-400 mt-3">
            This takes about 15–30 seconds...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg border ${getModeColor("written")}`}>
              <PenLine className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {subjectLabel(meta)} — Written Quiz
              </p>
              <p className="text-xs text-gray-500">
                {answeredCount} of {questions.length} answered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-600 font-medium">
            <PenLine className="h-3.5 w-3.5" />
            AI Graded
          </div>
        </div>

        {/* Progress */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-purple-500 transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-700">
          Answer each question in your own words. There is no time limit.
          Write clearly and in detail — your answers will be graded by AI
          with individual feedback.
        </div>

        {questions.map((q, i) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl border border-gray-200 p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="pt-1">
                {(meta.subjects?.length ?? 0) > 1 && q.subject && (
                  <span className="inline-block text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5 mb-1.5">
                    {q.subject}
                  </span>
                )}
                <p className="text-gray-900 font-medium leading-relaxed">
                  {q.question_text}
                </p>
              </div>
            </div>
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
              rows={5}
              placeholder="Type your answer here..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />
            <div className="flex justify-between mt-2">
              <span />
              <span
                className={`text-xs ${
                  (answers[q.id] || "").length > 20
                    ? "text-ink-500"
                    : "text-gray-400"
                }`}
              >
                {(answers[q.id] || "").length} characters
              </span>
            </div>
          </div>
        ))}

        {submitError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        <div className="flex justify-between items-center pb-8">
          <p className="text-sm text-gray-500">
            {answeredCount}/{questions.length} questions answered
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-6"
          >
            <Send className="h-4 w-4" />
            Submit for AI Grading
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Results Screen ───────────────────────────────────────────

function ResultsScreen({
  result,
  meta,
}: {
  result: QuizResult
  meta: QuizMeta
}) {
  const passed = result.passed

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-5">

        {/* Score Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 ${
              passed ? "bg-ink-100" : "bg-red-100"
            }`}
          >
            {passed ? (
              <CheckCircle2 className="h-10 w-10 text-ink-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-500" />
            )}
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-1">
            {result.score}%
          </h1>
          <p
            className={`text-lg font-bold mb-2 ${
              passed ? "text-ink-600" : "text-red-500"
            }`}
          >
            {passed ? "Quiz Passed!" : "Quiz Not Passed"}
          </p>
          <p className="text-gray-500 text-sm">
            {passed
              ? "Your application has been submitted to the school. You will be notified of the next steps."
              : `You needed ${meta.pass_mark}% to pass. You can apply for other jobs and try again.`}
          </p>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-xl font-bold text-gray-900">{result.correct}</p>
              <p className="text-xs text-gray-500">Correct</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{result.total}</p>
              <p className="text-xs text-gray-500">Questions</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {formatTime(result.time_taken)}
              </p>
              <p className="text-xs text-gray-500">Time Taken</p>
            </div>
          </div>
        </div>

        {/* Written Feedback */}
        {result.written_feedback && result.written_feedback.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PenLine className="h-5 w-5 text-purple-600" />
              AI Feedback
            </h2>
            <div className="space-y-4">
              {result.written_feedback.map((fb, i) => (
                <div
                  key={i}
                  className="p-4 border border-gray-100 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      Q{i + 1}. {fb.question}
                    </p>
                    <span
                      className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
                        fb.score >= fb.max_score * 0.7
                          ? "bg-ink-100 text-ink-700"
                          : fb.score >= fb.max_score * 0.4
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {fb.score}/{fb.max_score}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mb-2 italic">
                    Your answer: {fb.answer}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {fb.feedback}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/jobs" className="flex-1">
            <Button variant="outline" className="w-full">
              Browse More Jobs
            </Button>
          </Link>
          {passed && (
            <Link href="/dashboard/teacher/applications" className="flex-1">
              <Button className="w-full bg-ink-600 hover:bg-ink-700 text-white">
                View Application
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Quiz Page ───────────────────────────────────────────

export default function QuizPage() {
  const params = useParams()
  const jobId = params.jobId as string

  const [meta, setMeta] = useState<QuizMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [phase, setPhase] = useState<"pre" | "quiz" | "results">("pre")
  const [result, setResult] = useState<QuizResult | null>(null)

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const response = await fetch(`/api/quiz/${jobId}`)
        if (!response.ok) throw new Error("Quiz not found")
        const data = await response.json()
        setMeta(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz")
      } finally {
        setIsLoading(false)
      }
    }
    if (jobId) fetchMeta()
  }, [jobId])

  const handleComplete = (quizResult: QuizResult) => {
    setResult(quizResult)
    setPhase("results")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-ink-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (error || !meta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Quiz Unavailable
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {error || "This quiz could not be loaded."}
          </p>
          <Link href="/jobs">
            <Button className="bg-ink-600 hover:bg-ink-700 text-white">
              Back to Jobs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (phase === "pre") {
    return <PreQuizScreen meta={meta} onStart={() => setPhase("quiz")} />
  }

  if (phase === "results" && result) {
    return <ResultsScreen result={result} meta={meta} />
  }

  if (meta.mode === "written") {
    return <WrittenQuiz meta={meta} onComplete={handleComplete} />
  }

  return <MCQQuiz meta={meta} onComplete={handleComplete} />
}