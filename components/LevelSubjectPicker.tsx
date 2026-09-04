"use client"

import { TEACHING_LEVELS, getSubjectsForLevel } from "@/lib/constants"
import type { TeachingLevel, TeacherLevelSubjects } from "@/types"

interface LevelSubjectPickerProps {
  value: TeacherLevelSubjects[]
  onChange: (value: TeacherLevelSubjects[]) => void
  levelsError?: string
  subjectsError?: string
  /** Caps total subjects selected across all levels combined — e.g. 5 for a school posting one job listing. Omit for no cap. */
  maxSubjects?: number
}

/**
 * Pick teaching levels, then pick subjects scoped to each selected level.
 * Nursery/Primary have exactly one subject each, so it's auto-selected —
 * there's nothing for the teacher to choose there.
 */
export function LevelSubjectPicker({ value, onChange, levelsError, subjectsError, maxSubjects }: LevelSubjectPickerProps) {
  const selectedLevels = value.map((v) => v.level)
  const totalSubjects = deriveSubjects(value).length
  const atCap = maxSubjects !== undefined && totalSubjects >= maxSubjects

  const toggleLevel = (level: TeachingLevel) => {
    if (selectedLevels.includes(level)) {
      onChange(value.filter((v) => v.level !== level))
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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Levels</label>
        <div className="flex flex-wrap gap-2">
          {TEACHING_LEVELS.map((level) => (
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

            return (
              <div key={level} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {levelLabel} {isSingleSubject ? "" : "subjects"}
                </p>
                {isSingleSubject ? (
                  <p className="text-sm text-gray-700 font-medium">{options[0]}</p>
                ) : (
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
                  </div>
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
 * leaves the title exactly as typed.
 */
export function splitIntoSubjectJobs(baseTitle: string, levelSubjects: TeacherLevelSubjects[]): SubjectJobSplit[] {
  const subjects = deriveSubjects(levelSubjects)
  return subjects.map((subject) => ({
    subject,
    teaching_levels: levelSubjects.filter((ls) => ls.subjects.includes(subject)).map((ls) => ls.level),
    title: subjects.length > 1 ? `${baseTitle} – ${subject}` : baseTitle,
  }))
}
