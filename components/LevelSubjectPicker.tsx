"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { TEACHING_LEVELS, getSubjectsForLevel } from "@/lib/constants"
import type { TeachingLevel, TeacherLevelSubjects } from "@/types"

interface LevelSubjectPickerProps {
  value: TeacherLevelSubjects[]
  onChange: (value: TeacherLevelSubjects[]) => void
  levelsError?: string
  subjectsError?: string
  /** Caps total subjects selected across all levels combined — e.g. 5 for a school posting one job listing. Omit for no cap. */
  maxSubjects?: number
  /**
   * Show "Non-Teaching Staff" as a selectable level — job postings want
   * this (schools hire bursars, cleaners, security, etc., not just
   * teachers), but teacher registration/profile editing should NOT show
   * it, since a teacher isn't picking a level they teach. Defaults to
   * false so every existing caller is unaffected unless it opts in.
   */
  includeNonTeaching?: boolean
}

const MAX_CUSTOM_SUBJECT_LENGTH = 60

/**
 * Pick teaching levels, then pick subjects scoped to each selected level.
 * Nursery/Primary have exactly one subject each, so it's auto-selected —
 * there's nothing for the teacher to choose there.
 *
 * Each level also has a "+" to add a subject that isn't in our
 * predefined list (some schools teach things we don't have a fixed
 * name for). A custom subject is stored as a plain string in `value`
 * exactly like a predefined one — `jobs.subject` is a free-text
 * column with no constraint, so this needs zero schema change and
 * flows through job posting/splitting with no special-casing.
 *
 * It deliberately does NOT get added to lib/constants' LEVEL_SUBJECTS
 * (the shared, static list) — the quiz-subject picker on the post-job
 * form reads directly from getSubjectsForLevel(), so a custom subject
 * naturally never becomes selectable for the quiz. There's no quiz
 * content for a subject we just invented on the spot.
 */
export function LevelSubjectPicker({ value, onChange, levelsError, subjectsError, maxSubjects, includeNonTeaching = false }: LevelSubjectPickerProps) {
  const visibleLevels = includeNonTeaching
    ? TEACHING_LEVELS
    : TEACHING_LEVELS.filter((l) => l.value !== "non_teaching")
  const selectedLevels = value.map((v) => v.level)
  const totalSubjects = deriveSubjects(value).length
  const atCap = maxSubjects !== undefined && totalSubjects >= maxSubjects

  const [addingLevel, setAddingLevel] = useState<TeachingLevel | null>(null)
  const [customInput, setCustomInput] = useState("")
  const [customError, setCustomError] = useState("")

  const toggleLevel = (level: TeachingLevel) => {
    if (selectedLevels.includes(level)) {
      onChange(value.filter((v) => v.level !== level))
      if (addingLevel === level) closeCustomInput()
      return
    }
    const options = getSubjectsForLevel(level)
    // Nursery/Primary auto-select their one subject — but that still
    // counts against the cap, and there's no button to un-block it
    // later (it's rendered as plain text, not a toggle), so refuse to
    // add the level at all rather than add it stuck at zero subjects.
    if (options.length === 1 && atCap) return
    onChange([...value, { level, subjects: options.length === 1 ? options : [] }])
  }

  const toggleSubject = (level: TeachingLevel, subject: string) => {
    const isSelected = value.some((v) => v.level === level && v.subjects.includes(subject))
    // Cap only blocks adding a new subject — always allow unchecking one.
    if (!isSelected && atCap) return
    onChange(
      value.map((v) =>
        v.level === level
          ? {
              ...v,
              subjects: v.subjects.includes(subject)
                ? v.subjects.filter((s) => s !== subject)
                : [...v.subjects, subject],
            }
          : v
      )
    )
  }

  const closeCustomInput = () => {
    setAddingLevel(null)
    setCustomInput("")
    setCustomError("")
  }

  const addCustomSubject = (level: TeachingLevel) => {
    const trimmed = customInput.trim()
    if (!trimmed) {
      setCustomError("Enter a subject name")
      return
    }
    if (trimmed.length > MAX_CUSTOM_SUBJECT_LENGTH) {
      setCustomError(`Keep it under ${MAX_CUSTOM_SUBJECT_LENGTH} characters`)
      return
    }
    if (atCap) {
      setCustomError("You've reached the subject limit for this posting")
      return
    }
    const existingForLevel = value.find((v) => v.level === level)?.subjects ?? []
    const predefined = getSubjectsForLevel(level)
    const alreadyExists = [...predefined, ...existingForLevel].some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    )
    if (alreadyExists) {
      setCustomError("That subject is already in the list")
      return
    }

    onChange(
      value.map((v) =>
        v.level === level ? { ...v, subjects: [...v.subjects, trimmed] } : v
      )
    )
    closeCustomInput()
  }

  const removeCustomSubject = (level: TeachingLevel, subject: string) => {
    onChange(
      value.map((v) =>
        v.level === level ? { ...v, subjects: v.subjects.filter((s) => s !== subject) } : v
      )
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Levels</label>
        <div className="flex flex-wrap gap-2">
          {visibleLevels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => toggleLevel(level.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                selectedLevels.includes(level.value)
                  ? "bg-ink-600 text-white border-ink-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-ink-400"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
        {levelsError && <p className="text-red-500 text-xs mt-1">{levelsError}</p>}
      </div>

      {value.length > 0 && (
        <div className="space-y-3">
          {maxSubjects !== undefined && (
            <p className={`text-xs ${atCap ? "text-amber-600 font-medium" : "text-gray-400"}`}>
              {totalSubjects}/{maxSubjects} subjects selected{atCap ? " — that's the limit for one posting" : ""}
            </p>
          )}
          {value.map(({ level, subjects }) => {
            const levelLabel = TEACHING_LEVELS.find((l) => l.value === level)?.label ?? level
            const options = getSubjectsForLevel(level)
            const isSingleSubject = options.length === 1
            const customSubjects = subjects.filter((s) => !options.includes(s))
            const noun = level === "non_teaching" ? "position" : "subject"

            return (
              <div key={level} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {levelLabel} {isSingleSubject ? "" : level === "non_teaching" ? "positions" : "subjects"}
                </p>
                {isSingleSubject ? (
                  <p className="text-sm text-gray-700 font-medium">{options[0]}</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {options.map((subject) => {
                        const isChecked = subjects.includes(subject)
                        const disabled = !isChecked && atCap
                        return (
                          <button
                            key={subject}
                            type="button"
                            disabled={disabled}
                            onClick={() => toggleSubject(level, subject)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              isChecked
                                ? "bg-ink-600 text-white border-ink-600"
                                : disabled
                                ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
                                : "bg-white text-gray-600 border-gray-300 hover:border-ink-400"
                            }`}
                          >
                            {subject}
                          </button>
                        )
                      })}
                      {customSubjects.map((subject) => (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => removeCustomSubject(level, subject)}
                          title="Remove"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border bg-ink-600 text-white border-ink-600"
                        >
                          {subject}
                          <X className="h-3 w-3" />
                        </button>
                      ))}
                      {addingLevel !== level && (
                        <button
                          type="button"
                          disabled={atCap}
                          onClick={() => { setAddingLevel(level); setCustomInput(""); setCustomError("") }}
                          title={`Add a ${noun} not in the list`}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed transition-all ${
                            atCap
                              ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed"
                              : "bg-white text-ink-600 border-ink-300 hover:bg-ink-50"
                          }`}
                        >
                          <Plus className="h-3 w-3" />
                          Add {noun}
                        </button>
                      )}
                    </div>

                    {addingLevel === level && (
                      <div className="mt-2.5 flex items-start gap-2">
                        <div className="flex-1">
                          <input
                            autoFocus
                            value={customInput}
                            onChange={(e) => { setCustomInput(e.target.value); setCustomError("") }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); addCustomSubject(level) }
                              if (e.key === "Escape") closeCustomInput()
                            }}
                            placeholder={`e.g. Yoruba Literature`}
                            maxLength={MAX_CUSTOM_SUBJECT_LENGTH}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-ink-500"
                          />
                          {customError && <p className="text-red-500 text-xs mt-1">{customError}</p>}
                          {!customError && (
                            <p className="text-xs text-gray-400 mt-1">
                              Not in our list — won&apos;t be available for the subject quiz.
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => addCustomSubject(level)}
                          className="px-2.5 py-1.5 bg-ink-600 text-white text-xs font-medium rounded-lg hover:bg-ink-700"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={closeCustomInput}
                          className="px-2 py-1.5 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
          {subjectsError && <p className="text-red-500 text-xs">{subjectsError}</p>}
        </div>
      )}
    </div>
  )
}

export function deriveTeachingLevels(levelSubjects: TeacherLevelSubjects[]): TeachingLevel[] {
  return levelSubjects.map((v) => v.level)
}

export function deriveSubjects(levelSubjects: TeacherLevelSubjects[]): string[] {
  return Array.from(new Set(levelSubjects.flatMap((v) => v.subjects)))
}

export interface SubjectJobSplit {
  subject: string
  teaching_levels: TeachingLevel[]
  title: string
}

/**
 * Splits a level→subjects selection into one row per unique subject.
 * A job's `subject` is a single DB column, so "Mathematics + English"
 * selected together needs to become two separate job postings, not one
 * job claiming two subjects. Each row's teaching_levels is only the
 * levels that actually had that subject checked — e.g. "Mathematics"
 * checked under both JSS and SSS becomes one Mathematics job spanning
 * both, while a subject checked under only one level stays scoped to it.
 * When more than one subject is selected, the subject name is appended
 * to the base title so postings stay distinguishable in a list
 * ("Teacher – Mathematics", "Teacher – English"); a single subject
 * leaves the title exactly as typed. Works identically for a custom
 * (non-predefined) subject — it's just a string either way.
 */
export function splitIntoSubjectJobs(baseTitle: string, levelSubjects: TeacherLevelSubjects[]): SubjectJobSplit[] {
  const subjects = deriveSubjects(levelSubjects)
  return subjects.map((subject) => ({
    subject,
    teaching_levels: levelSubjects.filter((ls) => ls.subjects.includes(subject)).map((ls) => ls.level),
    title: subjects.length > 1 ? `${baseTitle} – ${subject}` : baseTitle,
  }))
}
