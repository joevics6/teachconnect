import type { TeachingLevel } from "@/types"

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi",
  "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun",
  "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara"
]

export const TEACHING_LEVELS: { value: TeachingLevel; label: string }[] = [
  { value: "nursery", label: "Nursery" },
  { value: "primary", label: "Primary" },
  { value: "jss", label: "Junior Secondary (JSS)" },
  { value: "sss", label: "Senior Secondary (SSS)" },
  { value: "tertiary", label: "Tertiary" },
]

/**
 * SINGLE SOURCE OF TRUTH for subjects.
 *
 * Subjects are scoped to a teaching level — a subject that exists at SSS
 * (e.g. "Physics") isn't necessarily offered at JSS, and vice versa.
 *
 * Nursery and Primary are each a single broad assessment category rather
 * than a list of subjects a teacher picks from — selecting the level IS
 * the subject. Their `topics` array is not shown to users anywhere; it
 * only guides the AI quiz-question generator on what to cover.
 */
export const LEVEL_SUBJECTS: Record<TeachingLevel, { name: string; topics?: string[] }[]> = {
  nursery: [
    {
      name: "Early Childhood Care & Education",
      topics: [
        "Child Development", "Classroom Management", "Play-Based Learning",
        "Early Literacy", "Phonics", "Numeracy", "Health and Safety",
        "Storytelling", "Montessori Concepts", "Creative Arts",
        "Child Psychology", "Teacher Ethics", "Behaviour Management",
        "Toilet Training & Routine Management", "Nutrition & Feeding Practices",
        "First Aid / Emergency Response", "Nigerian Languages & Cultural Songs/Stories",
        "Environmental Awareness & Sustainability", "Inclusive Education & Special Needs",
        "Basic Digital Awareness", "Parent-Teacher Collaboration",
        "Observation & Assessment Techniques",
      ],
    },
  ],

  primary: [
    {
      name: "Primary Education",
      topics: [
        "English Language", "Mathematics", "Basic Science", "Social Studies",
        "Quantitative Reasoning", "Verbal Reasoning", "Civic Education",
        "Computer Studies", "Teaching Methodology", "Lesson Planning",
        "Educational Psychology", "Classroom Management", "Assessment Methods",
        "Child Safeguarding", "Educational Technology", "Communication Skills",
        "Basic Moral Instruction", "Special Needs Awareness", "Nigerian Languages",
        "Physical & Health Education", "Cultural & Creative Arts", "Nigerian History",
        "Pre-Vocational Studies", "Basic Digital Literacy",
        "French / Arabic (introductory)", "Environmental Education",
        "Inclusive & Differentiated Instruction",
      ],
    },
  ],

  jss: [
    "English Language", "Mathematics", "Basic Science", "Basic Technology",
    "Social Studies", "Agricultural Science", "Business Studies",
    "Home Economics", "Computer Studies", "French", "History",
    "Christian Religious Studies", "Islamic Religious Studies",
    "Civic Education", "Security Education", "Creative Arts",
    "Physical Education", "Yoruba", "Hausa", "Igbo", "Pre-Vocational Studies",
  ].map((name) => ({ name })),

  sss: [
    "English Language", "Mathematics", "Further Mathematics", "Physics",
    "Chemistry", "Biology", "Economics", "Commerce", "Accounting",
    "Government", "Literature in English", "History", "Geography",
    "Agricultural Science", "Technical Drawing", "Computer Science",
    "Data Processing", "French", "Christian Religious Studies",
    "Islamic Religious Studies", "Marketing", "Food and Nutrition",
    "Music", "Fine Arts", "Civic Education", "Yoruba", "Hausa", "Igbo",
    "Arabic", "Physical and Health Education", "Entrepreneurship",
    "Environmental Science",
  ].map((name) => ({ name })),

  tertiary: [
    "English Language", "Mathematics", "Physics", "Chemistry", "Biology",
    "Computer Science", "Statistics & Research Methods", "Accounting",
    "Economics", "Business Management", "Marketing", "Entrepreneurship",
    "Political Science", "Sociology", "Sociology of Education", "Psychology",
    "History", "Geography", "Mass Communication", "Communication Studies",
    "Educational Psychology", "Curriculum Studies", "Guidance & Counselling",
    "Educational Technology", "Human Anatomy", "Human Physiology",
    "Pharmacology", "Microbiology", "Biochemistry", "Public Health",
    "Nursing Sciences", "Library & Information Science",
    "Christian Religious Studies", "Islamic Religious Studies",
    "Agricultural Science", "French", "Law", "Information Technology",
    "Data Science", "Human Resource Management", "Creative Arts",
    "Special Education / Inclusive Education", "Adult & Non-Formal Education",
    "Vocational & Technical Education", "Educational Administration & Planning",
    "Comparative Education", "Environmental Science / Sustainability Studies",
    "AI & Machine Learning in Education", "Peace & Conflict Resolution Studies",
    "Philosophy of Education", "Measurement & Evaluation in Education",
    "Teacher Education (General Methodologies)",
  ].map((name) => ({ name })),
}

/** Subject names for a given level (no topics) — what dropdowns should render. */
export function getSubjectsForLevel(level: TeachingLevel): string[] {
  return (LEVEL_SUBJECTS[level] ?? []).map((s) => s.name)
}

/**
 * Subject names across ALL given levels (union, deduped) — e.g. selecting
 * both Primary and SSS shows "Primary Education" AND the full SSS subject
 * list, not just names common to both (which for levels like Primary,
 * whose only "subject" is the broad category itself, would always be
 * empty — an intersection here effectively hid every subject).
 */
export function getSubjectsForLevels(levels: TeachingLevel[]): string[] {
  if (levels.length === 0) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const level of levels) {
    for (const name of getSubjectsForLevel(level)) {
      if (!seen.has(name)) {
        seen.add(name)
        result.push(name)
      }
    }
  }
  return result
}

/** AI-generation topic hints for a subject at a level (nursery/primary only — undefined otherwise). */
export function getTopicsForSubject(level: TeachingLevel, subjectName: string): string[] | undefined {
  return LEVEL_SUBJECTS[level]?.find((s) => s.name === subjectName)?.topics
}

/** Every distinct subject name across all levels, deduped — for level-agnostic contexts (e.g. CV parsing). */
export const ALL_SUBJECTS: string[] = Array.from(
  new Set(Object.values(LEVEL_SUBJECTS).flatMap((list) => list.map((s) => s.name)))
)

export const BENEFITS = [
  "Health Insurance",
  "Transport Allowance",
  "Pension",
  "School Fee Discount for Staff Children",
  "Housing Allowance",
  "Lunch",
  "Professional Development",
]

// Plan/add-on pricing lives in lib/pricing.ts (single source of truth).
