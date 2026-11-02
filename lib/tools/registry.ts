// ============================================================
// lib/tools/registry.ts
// Every free tool on /tools. A tool page is rendered from its entry here
// (copy, FAQ, SEO) plus the component mapped in components/tools/index.ts.
// To add a tool: add an entry, then its component. The sitemap and the
// /tools index pick it up automatically.
// ============================================================

export interface ToolFaq {
  q: string
  a: string
}

export interface ToolEntry {
  slug: string
  /** Short name used in lists, breadcrumbs and links. */
  name: string
  h1: string
  /** <title>; keep under about 60 characters. */
  metaTitle: string
  metaDescription: string
  /** One line for the /tools cards. */
  blurb: string
  audience: "teachers" | "schools" | "parents"
  intro: string[]
  steps: string[]
  sections: { heading: string; body: string[] }[]
  faqs: ToolFaq[]
}

export const TOOLS: ToolEntry[] = [
  {
    slug: "lesson-note-generator",
    name: "Lesson Note Generator",
    h1: "Free Lesson Note Generator for Nigerian Teachers",
    metaTitle: "Free Lesson Note Generator Nigeria – PDF in Nigerian Format",
    metaDescription:
      "Make a complete lesson note in the standard Nigerian format in seconds. Choose class, subject and topic, then download it as PDF or Word. Free for Nursery, Primary, JSS and SS teachers.",
    blurb: "Pick a class, subject and topic and get a full lesson note you can download as PDF or Word.",
    audience: "teachers",
    intro: [
      "Writing a lesson note for every period takes hours. This free generator writes a complete one for you: behavioural objectives, previous knowledge, instructional materials, introduction, a step-by-step presentation, blackboard summary, evaluation questions with answers, conclusion and assignment.",
      "It follows the lesson note layout used in Nigerian schools and is written to suit the class you choose, from Nursery to SS 3, using familiar Nigerian examples. Download it as a PDF to print, or as a Word file to edit and add your own touches.",
    ],
    steps: [
      "Choose the class and the subject.",
      "Type the topic (and a sub-topic if you have one). Add the term, week and lesson length if you like.",
      "Optionally add your school and name so they appear on the note.",
      "Press Generate, read it through, then download it as PDF or Word.",
    ],
    sections: [
      {
        heading: "What a Nigerian lesson note contains",
        body: [
          "A lesson note is the teacher's written plan for one lesson. Most Nigerian schools expect the same core parts: the class, subject, topic and duration; the behavioural objectives (what pupils should be able to do by the end); previous knowledge; instructional materials; an introduction; the presentation, set out step by step with what the teacher and the pupils do; a blackboard summary; evaluation questions; a conclusion; and an assignment.",
          "Schools differ in small ways, such as the order of the headings or the extra columns they ask for, so use the Word download to match your school's own layout.",
        ],
      },
      {
        heading: "Aligned with the NERDC curriculum",
        body: [
          "The notes are written to match the topics and level of the Nigerian curriculum published by the NERDC for the class you choose. There is no single official lesson note template that every school must use, so treat the result as a strong first draft and check it against your scheme of work.",
        ],
      },
      {
        heading: "Tips for getting a better lesson note",
        body: [
          "Be specific with the topic. \"Addition of fractions with the same denominator\" gives a sharper note than \"Fractions\". Add the sub-topic when your scheme of work has one, and set the lesson length to your real period so the timings in the presentation add up.",
        ],
      },
    ],
    faqs: [
      { q: "Is the lesson note generator really free?", a: "Yes. There is no sign-up and no charge. To keep it free for everyone there is a limit on how many notes one person can generate per hour and per day." },
      { q: "Which classes and subjects does it cover?", a: "Nursery 1 to SS 3. Each class has its own subject list covering the usual Nigerian school subjects, and you can type your own subject if it is not listed." },
      { q: "Is it the official NERDC format?", a: "It uses the standard lesson note layout common in Nigerian schools and is written to fit the NERDC curriculum for the class. NERDC does not publish one compulsory lesson note template, and schools vary slightly, so adjust the headings to your school's format using the Word download." },
      { q: "Can I edit the lesson note?", a: "Yes. Download the Word version and edit it freely. You can also copy the text and paste it into your own document." },
      { q: "Is the content always correct?", a: "It is written by AI, so always read it through before you teach. Check facts, examples and the timing, and change anything that does not suit your class." },
    ],
  },
]

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug)
