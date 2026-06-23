export type UserRole = "teacher" | "school"

export type TeachingLevel =
  | "nursery"
  | "primary"
  | "jss"
  | "sss"
  | "tertiary"

export type EmploymentType =
  | "full-time"
  | "part-time"
  | "contract"

export type ApplicationStage =
  | "applied"
  | "shortlisted"
  | "interview"
  | "offered"
  | "hired"
  | "rejected"

export type TRCNStatus =
  | "registered"
  | "pending"
  | "not-registered"

export type SchoolType =
  | "private"
  | "public"
  | "international"
  | "missionary"

export type PlanType =
  | "free"
  | "standard"
  | "term"

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export interface TeacherProfile {
  id: string
  user_id: string
  full_name: string
  phone: string
  state: string
  lga: string
  teaching_levels: TeachingLevel[]
  subjects: string[]
  years_experience: number
  trcn_number?: string
  trcn_status: TRCNStatus
  preferred_states: string[]
  willing_to_relocate: boolean
  accommodation_needed: boolean
  availability: string
  salary_min: number
  salary_max: number
  bio: string
  photo_url?: string
  cv_url?: string
  is_visible: boolean
  profile_completion: number
  created_at: string
}

export interface SchoolProfile {
  id: string
  user_id: string
  school_name: string
  school_type: SchoolType
  school_levels: TeachingLevel[]
  state: string
  lga: string
  address: string
  website?: string
  contact_name: string
  contact_role: string
  contact_email: string
  contact_phone: string
  cac_number?: string
  logo_url?: string
  is_verified: boolean
  created_at: string
}

export interface Job {
  id: string
  school_id: string
  school?: SchoolProfile
  title: string
  subject: string
  teaching_levels: TeachingLevel[]
  employment_type: EmploymentType
  positions: number
  salary_min: number
  salary_max: number
  accommodation_offered: boolean
  accommodation_type?: string
  benefits: string[]
  is_private: boolean
  is_featured: boolean
  quiz_enabled: boolean
  quiz_subject?: string
  quiz_difficulty?: string
  quiz_pass_mark?: number
  description: string
  required_qualifications: string
  preferred_qualifications?: string
  deadline: string
  status: "active" | "closed" | "draft"
  created_at: string
}

export interface Application {
  id: string
  job_id: string
  teacher_id: string
  job?: Job
  teacher?: TeacherProfile
  quiz_attempt_id?: string
  quiz_score?: number
  pipeline_stage: ApplicationStage
  created_at: string
}

export interface QuizQuestion {
  id: string
  subject: string
  difficulty_level: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: "a" | "b" | "c" | "d"
}

export interface QuizAttempt {
  id: string
  teacher_id: string
  job_id: string
  score: number
  passed: boolean
  time_taken_seconds: number
  created_at: string
}

export interface Subscription {
  id: string
  school_id: string
  plan_type: PlanType
  paystack_reference: string
  amount_paid: number
  starts_at: string
  expires_at: string
  is_active: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  metadata?: Record<string, unknown>
  created_at: string
}