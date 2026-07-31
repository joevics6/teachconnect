"use client"

import { TEACHING_LEVELS, getSubjectsForLevel } from "@/lib/constants"
import type { TeachingLevel, TeacherLevelSubjects } from "@/types"

interface LevelSubjectPickerProps {
  value: TeacherLevelSubjects[]
  onChange: (value: TeacherLevelSubjects[]) => void
  levelsError?: string
  subjectsError?: string
}

/**
 * Pick teaching levels, then pick subjects scoped to each selected level.
 * Nursery/Primary have exactly one subject each, so it's auto-selected —
 * there's nothing for the teacher to choose there.
 */
export function LevelSubjectPicker({ value, onChange, levelsError, subjectsError }: LevelSubjectPickerProps) {
  const selectedLevels = value.map((v) => v.level)

  const toggleLevel = (level: TeachingLevel) => {
    if (selectedLevels.includes(level)) {
      onChange(value.filter((v) => v.level !== level))
      return
    }
    const options = getSubjectsForLevel(level)
    // Nursery/Primary: only one option exists — select it automatically.
    onChange([...value, { level, subjects: options.length === 1 ? options : [] }])
  }

  const toggleSubject = (level: TeachingLevel, subject: string) => {
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
                    {options.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(level, subject)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          subjects.includes(subject)
                            ? "bg-ink-600 text-white border-ink-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-ink-400"
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
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
