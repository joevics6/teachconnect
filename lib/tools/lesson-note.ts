// ============================================================
// lib/tools/lesson-note.ts
// Shared (browser + server) pieces of the Lesson Note Generator: the shapes
// and the step that turns the AI's lesson into a ToolDoc. The prompt and
// validation live in lesson-note-server.ts.
// ============================================================

import type { ToolDoc } from "./doc"
import { learnerWord } from "./curriculum"

export interface LessonNoteRequest {
  className: string
  subject: string
  topic: string
  subtopic?: string
  term?: string
  week?: string
  duration: number
  includeAnswers: boolean
}

/** Typed by the teacher; goes on the note but is never sent to the AI. */
export interface LessonNoteDetails {
  school?: string
  teacher?: string
  date?: string
  pupilsInClass?: string
  averageAge?: string
}

export interface LessonNoteContent {
  objectives: string[]
  previousKnowledge: string
  materials: string[]
  references: string[]
  introduction: string
  steps: { title: string; content: string; teacherActivity: string; pupilActivity: string }[]
  summary: string[]
  evaluation: { question: string; answer: string }[]
  conclusion: string
  assignment: string[]
}

const blank = "............................"

export function buildLessonNoteDoc(
  req: LessonNoteRequest,
  details: LessonNoteDetails,
  note: LessonNoteContent
): ToolDoc {
  const who = learnerWord(req.className)
  const term = [req.term, req.week ? `Week ${req.week}` : ""].filter(Boolean).join(", ")

  const slug = `lesson-note-${req.className}-${req.subject}-${req.topic}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70)

  const blocks: ToolDoc["blocks"] = [
    { type: "title", text: "Lesson Note", subtitle: details.school || undefined },
    {
      type: "fields",
      rows: [
        ["Subject", req.subject],
        ["Class", req.className],
        ["Topic", req.topic],
        ["Sub-topic", req.subtopic || "—"],
        ["Term / Week", term || blank],
        ["Date", details.date || blank],
        ["Duration", `${req.duration} minutes`],
        ["Teacher", details.teacher || blank],
        [`No. of ${who}`, details.pupilsInClass || blank],
        ["Average age", details.averageAge ? `${details.averageAge} years` : blank],
      ],
    },
    { type: "heading", text: "Behavioural Objectives" },
    { type: "paragraph", text: `By the end of the lesson, the ${who} should be able to:` },
    { type: "list", items: note.objectives, ordered: true },
    { type: "heading", text: "Previous Knowledge" },
    { type: "paragraph", text: note.previousKnowledge },
    { type: "heading", text: "Instructional Materials" },
    { type: "list", items: note.materials },
    { type: "heading", text: "Reference Materials" },
    { type: "list", items: note.references },
    { type: "heading", text: "Introduction" },
    { type: "paragraph", text: note.introduction },
    { type: "heading", text: "Presentation" },
    {
      type: "table",
      head: ["Step and Content", "Teacher's Activity", `${who === "pupils" ? "Pupils'" : "Students'"} Activity`],
      rows: note.steps.map((s) => [`${s.title}\n\n${s.content}`, s.teacherActivity, s.pupilActivity]),
      widths: [50, 25, 25],
    },
    { type: "heading", text: "Blackboard Summary" },
    { type: "list", items: note.summary },
    { type: "heading", text: "Evaluation" },
    { type: "list", items: note.evaluation.map((e) => e.question), ordered: true },
  ]

  if (req.includeAnswers) {
    blocks.push(
      { type: "heading", text: "Evaluation Answers" },
      { type: "list", items: note.evaluation.map((e) => e.answer), ordered: true }
    )
  }

  blocks.push(
    { type: "heading", text: "Conclusion" },
    { type: "paragraph", text: note.conclusion },
    { type: "heading", text: "Assignment" },
    { type: "list", items: note.assignment, ordered: true }
  )

  return { title: `Lesson Note – ${req.topic}`, filename: slug || "lesson-note", blocks }
}
