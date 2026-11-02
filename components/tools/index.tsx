import LessonNoteTool from "./LessonNoteTool"

/** The interactive part of a tool page, by registry slug (lib/tools/registry.ts). */
export function ToolRenderer({ slug }: { slug: string }) {
  switch (slug) {
    case "lesson-note-generator":
      return <LessonNoteTool />
    default:
      return null
  }
}
