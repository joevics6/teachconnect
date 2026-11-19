// ============================================================
// lib/role-categories.ts
// One standard name per role, so "English Teacher" and "English Language
// Teacher" (or "ICT Teacher" / "Computer Teacher") are the same role page.
// A role page (/jobs/category/[slug]) needs 6+ live jobs, so spelling
// variants that split the count mean fewer pages exist.
//
// normalizeRoleCategory() is applied wherever role_category is saved (AI
// parsers, the admin edit route). The AI prompts also show STANDARD_ROLES.
// Names not covered here pass through cleaned up, so new roles still work.
// ============================================================

export const STANDARD_ROLES = [
  "Nursery Teacher",
  "Primary School Teacher",
  "Secondary School Teacher",
  "Mathematics Teacher",
  "English Language Teacher",
  "Physics Teacher",
  "Chemistry Teacher",
  "Biology Teacher",
  "Science Teacher",
  "Computer / ICT Teacher",
  "Economics Teacher",
  "Accounting Teacher",
  "Business Studies Teacher",
  "Government Teacher",
  "Geography Teacher",
  "History Teacher",
  "Agricultural Science Teacher",
  "Christian Religious Studies Teacher",
  "Islamic Studies Teacher",
  "French Teacher",
  "Yoruba Teacher",
  "Igbo Teacher",
  "Hausa Teacher",
  "Music Teacher",
  "Creative Arts Teacher",
  "Home Economics Teacher",
  "Technology Teacher",
  "Physical Education Teacher",
  "Vocational Teacher",
  "NYSC Teacher",
  "Head Teacher",
  "Principal",
  "Vice Principal",
  "School Bursar",
  "Driver",
] as const

// Exact (lower-case) spellings seen in the data and their standard name.
const ALIASES: Record<string, string> = {
  "english teacher": "English Language Teacher",
  "english language teacher": "English Language Teacher",
  "english and literature teacher": "English Language Teacher",
  "ict teacher": "Computer / ICT Teacher",
  "computer teacher": "Computer / ICT Teacher",
  "computer science teacher": "Computer / ICT Teacher",
  "computer studies teacher": "Computer / ICT Teacher",
  "basic science teacher": "Science Teacher",
  "basic technology teacher": "Technology Teacher",
  "design and technology teacher": "Technology Teacher",
  "design & technology teacher": "Technology Teacher",
  "technical drawing teacher": "Technology Teacher",
  "business management teacher": "Business Studies Teacher",
  "accounts and economics teacher": "Accounting Teacher",
  "junior secondary school teacher": "Secondary School Teacher",
  "senior secondary school teacher": "Secondary School Teacher",
  "secondary teacher": "Secondary School Teacher",
  "primary teacher": "Primary School Teacher",
  "nursery school teacher": "Nursery Teacher",
  "school bus driver": "Driver",
  "head teacher / principal": "Principal",
  "crs teacher": "Christian Religious Studies Teacher",
  "cre teacher": "Christian Religious Studies Teacher",
  "irs teacher": "Islamic Studies Teacher",
  "pe teacher": "Physical Education Teacher",
  "cca teacher": "Creative Arts Teacher",
}

export function normalizeRoleCategory(raw: string | null | undefined): string | null {
  const cleaned = (raw ?? "")
    .replace(/\s+jobs?$/i, "")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return null

  const key = cleaned.toLowerCase()
  const exact = STANDARD_ROLES.find((r) => r.toLowerCase() === key)
  if (exact) return exact
  if (ALIASES[key]) return ALIASES[key]

  // Keyword fallbacks for spellings we haven't seen yet.
  if (/\b(ict|computer)\b/.test(key) && /teacher|instructor/.test(key)) return "Computer / ICT Teacher"
  if (/^english\b/.test(key) && /teacher/.test(key)) return "English Language Teacher"
  if (/\bdriver\b/.test(key)) return "Driver"

  return cleaned.slice(0, 80)
}
