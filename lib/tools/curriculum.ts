// ============================================================
// lib/tools/curriculum.ts
// Classes and subjects used by the teacher tools (lesson notes, scheme of
// work, ...), grouped the way Nigerian schools do.
// ============================================================

export type Band = "nursery" | "primary" | "jss" | "ss"

export const CLASS_GROUPS: { label: string; band: Band; classes: string[] }[] = [
  { label: "Nursery", band: "nursery", classes: ["Nursery 1", "Nursery 2", "Nursery 3"] },
  { label: "Primary", band: "primary", classes: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"] },
  { label: "Junior Secondary", band: "jss", classes: ["JSS 1", "JSS 2", "JSS 3"] },
  { label: "Senior Secondary", band: "ss", classes: ["SS 1", "SS 2", "SS 3"] },
]

export const ALL_CLASSES = CLASS_GROUPS.flatMap((g) => g.classes)

export function bandOf(className: string): Band | null {
  return CLASS_GROUPS.find((g) => g.classes.includes(className))?.band ?? null
}

const NURSERY = [
  "Number Work (Numeracy)", "Letter Work (Literacy)", "Phonics", "Health Habits", "Social Habits",
  "Rhymes and Songs", "Colour Work", "Nature Study", "Creative Arts", "Christian Religious Studies", "Islamic Religious Studies",
]
const PRIMARY = [
  "English Language", "Mathematics", "Basic Science and Technology", "Social Studies", "Civic Education",
  "Christian Religious Studies", "Islamic Religious Studies", "Cultural and Creative Arts", "Agricultural Science",
  "Home Economics", "Physical and Health Education", "Computer Studies / ICT", "Verbal Reasoning", "Quantitative Reasoning",
  "Phonics", "Handwriting", "French", "Yoruba", "Igbo", "Hausa", "Security Education", "Vocational Aptitude",
]
const JSS = [
  "English Language", "Mathematics", "Basic Science", "Basic Technology", "Social Studies", "Civic Education",
  "Christian Religious Studies", "Islamic Religious Studies", "Business Studies", "Agricultural Science", "Home Economics",
  "Physical and Health Education", "Computer Studies / ICT", "Cultural and Creative Arts", "History", "French",
  "Yoruba", "Igbo", "Hausa", "Security Education",
]
const SS = [
  "English Language", "General Mathematics", "Further Mathematics", "Physics", "Chemistry", "Biology", "Agricultural Science",
  "Economics", "Government", "Literature in English", "Geography", "Commerce", "Financial Accounting", "Civic Education",
  "Christian Religious Studies", "Islamic Religious Studies", "Computer Studies / ICT", "Data Processing", "Technical Drawing",
  "Food and Nutrition", "Marketing", "History", "French", "Yoruba", "Igbo", "Hausa",
]

const SUBJECTS: Record<Band, string[]> = { nursery: NURSERY, primary: PRIMARY, jss: JSS, ss: SS }

export const OTHER_SUBJECT = "Other (type your own)"

export function subjectsFor(className: string): string[] {
  const band = bandOf(className)
  return band ? [...SUBJECTS[band], OTHER_SUBJECT] : []
}

/** Nursery and primary have pupils; secondary has students. */
export function learnerWord(className: string): "pupils" | "students" {
  const band = bandOf(className)
  return band === "jss" || band === "ss" ? "students" : "pupils"
}

export const TERMS = ["First Term", "Second Term", "Third Term"] as const
