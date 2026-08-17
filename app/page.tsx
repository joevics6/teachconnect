"use client"

import Link from "next/link"
import {
  Search, FileCheck, Building2, MapPin,
  CheckCircle2, BookOpen, Shield, ArrowRight, X,
  Users, GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth, type AuthUser } from "@/lib/auth-context"

// ─── Signature hero visual #1 — the actual product mechanic, not a
// decorative illustration: quiz scores rank applicants automatically,
// so a school opens a short, ordered shortlist instead of a CV pile. ──
function RankingCard() {
  const rows = [
    { name: "Chidinma A.", subject: "Mathematics", score: 94, top: true },
    { name: "Tunde O.",    subject: "Mathematics", score: 88, top: false },
    { name: "Ngozi E.",    subject: "Mathematics", score: 81, top: false },
  ]
  return (
    <div className="bg-white rounded-2xl border border-ink-100 shadow-xl shadow-ink-900/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Mathematics Teacher — Ranked</p>
        <span className="text-xs text-gray-400">Auto-sorted</span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div
            key={r.name}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
              r.top ? "bg-brass-50 border border-brass-200" : "bg-gray-50 border border-transparent"
            }`}
          >
            <span className={`font-display text-sm w-5 text-center ${r.top ? "text-brass-600" : "text-gray-400"}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
              <p className="text-xs text-gray-500">{r.subject}</p>
            </div>
            <span className={`text-sm font-semibold ${r.top ? "text-brass-700" : "text-ink-600"}`}>
              {r.score}%
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400">18 more applicants screened</p>
        <CheckCircle2 className="h-4 w-4 text-ink-400" />
      </div>
    </div>
  )
}

// ─── Signature hero visual #2 — a verified teacher profile card. Paired
// with the ranking card, these two mockups ARE the product, so the hero
// composition is a real screenshot of what happens on both sides of a
// hire rather than stock photography. ──
function ProfileCard() {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 shadow-lg shadow-ink-900/10 p-4 w-64">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-ink-800 flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-5 w-5 text-brass-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">Amara N.</p>
          <p className="text-xs text-gray-500">Biology · SS1–SS3</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5 w-fit">
        <CheckCircle2 className="h-3.5 w-3.5" />
        92nd Percentile
      </div>
    </div>
  )
}

function HeroCTAs({ user, isLoading, dashboardLink }: { user: AuthUser | null; isLoading: boolean; dashboardLink: string }) {
  if (isLoading) return <div className="h-12 w-64 bg-ink-100 rounded-xl animate-pulse" />
  if (user?.role === "teacher") return (
    <div className="grid grid-cols-2 gap-3 max-w-md">
      <Link href="/jobs">
        <Button size="lg" className="w-full bg-ink-800 hover:bg-ink-900 text-white px-4 py-6 text-sm sm:text-base rounded-xl">
          <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="hidden sm:inline">Browse Teaching Jobs</span>
          <span className="sm:hidden">Browse Jobs</span>
        </Button>
      </Link>
      <Link href={dashboardLink}>
        <Button size="lg" variant="outline" className="w-full px-4 py-6 text-sm sm:text-base rounded-xl border-ink-200">
          <span className="hidden sm:inline">Go to Dashboard</span>
          <span className="sm:hidden">Dashboard</span>
        </Button>
      </Link>
    </div>
  )
  if (user?.role === "school") return (
    <div className="grid grid-cols-2 gap-3 max-w-md">
      <Link href="/dashboard/school/post-job">
        <Button size="lg" className="w-full bg-ink-800 hover:bg-ink-900 text-white px-4 py-6 text-sm sm:text-base rounded-xl">
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />Post a Job
        </Button>
      </Link>
      <Link href="/talent">
        <Button size="lg" variant="outline" className="w-full px-4 py-6 text-sm sm:text-base rounded-xl border-ink-200">
          Browse Teachers
        </Button>
      </Link>
    </div>
  )
  return (
    <div className="grid grid-cols-2 gap-3 max-w-md">
      <Link href="/register/teacher">
        <Button size="lg" className="w-full bg-ink-800 hover:bg-ink-900 text-white px-4 py-6 text-sm sm:text-base rounded-xl">
          Find Teaching Jobs
        </Button>
      </Link>
      <Link href="/register/school">
        <Button size="lg" variant="outline" className="w-full px-4 py-6 text-sm sm:text-base rounded-xl border-ink-200">
          Find Teachers
        </Button>
      </Link>
    </div>
  )
}

function BottomCTA({ user }: { user: AuthUser | null }) {
  if (user?.role === "teacher") return (
    <Link href="/jobs">
      <Button size="lg" className="bg-white text-ink-900 hover:bg-brass-50 px-8 py-6 text-base rounded-xl">
        Browse Jobs Now
      </Button>
    </Link>
  )
  if (user?.role === "school") return (
    <Link href="/dashboard/school/post-job">
      <Button size="lg" className="bg-white text-ink-900 hover:bg-brass-50 px-8 py-6 text-base rounded-xl">
        Post a Job
      </Button>
    </Link>
  )
  return (
    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
      <Link href="/register/teacher">
        <Button size="lg" className="w-full bg-white text-ink-900 hover:bg-brass-50 px-4 py-6 text-sm sm:text-base rounded-xl">
          <span className="hidden sm:inline">Join as a Teacher</span>
          <span className="sm:hidden">Join as Teacher</span>
        </Button>
      </Link>
      <Link href="/register/school">
        <Button size="lg" variant="outline" className="w-full bg-transparent border-ink-400 text-white hover:bg-ink-800 px-4 py-6 text-sm sm:text-base rounded-xl">
          <span className="hidden sm:inline">Register Your School</span>
          <span className="sm:hidden">Register School</span>
        </Button>
      </Link>
    </div>
  )
}

const TRUST_POINTS = [
  { icon: BookOpen, label: "Quiz-screened applicants" },
  { icon: MapPin, label: "Every state, LGA-level" },
  { icon: Users,  label: "Direct — no recruiters" },
]

const TEACHER_STEPS = [
  { icon: FileCheck, title: "Build your profile", desc: "Upload your CV, add your subjects and teaching levels. Takes 5 minutes." },
  { icon: Search,    title: "Browse & apply",     desc: "Filter jobs by subject, level, location and salary. Apply in one click." },
  { icon: BookOpen,  title: "Pass the quiz",      desc: "Some schools include a subject quiz. Pass it and your application rises to the top." },
]

const SCHOOL_STEPS = [
  { icon: Building2, title: "Post your vacancy",       desc: "Describe the role, set the salary, choose a subject quiz. Live in under 5 minutes." },
  { icon: Shield,    title: "Quiz does the screening", desc: "Only teachers who pass your subject quiz at your required score appear in your pipeline." },
  { icon: MapPin,    title: "Review & hire",           desc: "Browse ranked applicants, view full profiles and CVs, and move candidates through your pipeline." },
]

const FEATURES = [
  { icon: BookOpen,     title: "Subject Mastery Quiz", desc: "Teachers prove their knowledge. Schools get a percentile rank on every applicant." },
  { icon: FileCheck,    title: "CV Parsing",           desc: "Upload once. We extract your experience, subjects, and skills automatically." },
  { icon: CheckCircle2, title: "Direct Contact",        desc: "Call or WhatsApp teachers directly from their profile — no back-and-forth." },
  { icon: MapPin,       title: "Location Matching",    desc: "Filter by state and LGA. Find opportunities — or talent — right in your area." },
  { icon: Shield,       title: "Verified Profiles",    desc: "Every school and teacher profile is tied to a verified account." },
  { icon: Search,       title: "Direct Applications",  desc: "No recruiters or middlemen. Teachers and schools deal with each other directly." },
]

export default function HomePage() {
  const { user, isLoading, dashboardLink } = useAuth()

  return (
    <div className="flex flex-col">

      {/* Hero — thesis statement on the left; on the right, two layered
          product-mockup cards (ranking + verified profile) instead of
          stock photography, so the visual IS the value proposition. A
          trust strip sits right under the CTAs to close the gap before
          the next section and answer "why should I trust this" fast. */}
      <section className="relative bg-white pt-14 pb-14 px-4 sm:pt-20 sm:pb-20 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
          {/* Centered on mobile — badge, heading, copy, and CTAs all
              stack centered, matching the /pricing hero pattern. From
              lg up it switches to the left-aligned column beside the
              product visual. */}
          <div className="text-center lg:text-left">
            <h1 className="font-display text-[2.25rem] sm:text-5xl lg:text-[3.4rem] text-ink-950 leading-[1.2] sm:leading-[1.08] mb-5">
              Stop drowning in CVs.<br />
              Start hiring teachers who can actually teach.
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
              A quick subject quiz screens every applicant — you get a ranked shortlist, not a stack of CVs.
            </p>
            <div className="mx-auto lg:mx-0 w-fit">
              <HeroCTAs user={user} isLoading={isLoading} dashboardLink={dashboardLink} />
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 mt-8 pt-6 border-t border-gray-100">
              {TRUST_POINTS.map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-sm text-gray-600">
                  <t.icon className="h-4 w-4 text-ink-500 flex-shrink-0" />
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute -inset-x-8 -inset-y-12 -z-10 bg-gradient-to-br from-brass-50 via-ink-50/60 to-transparent rounded-[3rem] blur-2xl" />

            <div className="relative w-full max-w-sm">
              <div className="hidden sm:block absolute -top-10 -left-6 rotate-[-2deg] z-0">
                <ProfileCard />
              </div>
              <div className="relative z-10 sm:mt-24">
                <RankingCard />
              </div>
              {/* Contrast callout — the "before" this replaces */}
              <div className="absolute -bottom-6 -right-2 hidden sm:flex items-center gap-2 bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3 z-20">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 leading-tight">
                  No more<br /><span className="font-medium text-gray-700">200-CV inbox</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The old way vs. the ClassHire way — a real comparison, not a
          decorative stat strip. */}
      <section className="bg-ink-950 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ink-800 rounded-2xl overflow-hidden">
            <div className="bg-ink-950 p-8">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">The old way</p>
              <ul className="space-y-3">
                {[
                  "Reading through 200 CVs, one at a time",
                  "No way to verify a claimed subject skill",
                  "Interviews before you know who's qualified",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-gray-400">
                    <X className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-ink-900 p-8">
              <p className="text-xs font-semibold text-brass-400 uppercase tracking-wide mb-4">With ClassHire</p>
              <ul className="space-y-3">
                {[
                  "A subject quiz screens applicants automatically",
                  "Every candidate arrives with a verified score",
                  "You open a ranked shortlist, not an inbox",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-gray-200">
                    <CheckCircle2 className="h-4 w-4 text-brass-500 flex-shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Teachers + Schools side by side in one section
          instead of two stacked full-height sections. Same content,
          roughly half the scroll distance. */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 max-w-xl">
            <h2 className="font-display text-3xl text-ink-950 mb-3">Three steps, either side of the hire</h2>
            <p className="text-gray-500">No recruiters, no middlemen. Teachers and schools deal with each other directly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
              <p className="text-ink-600 text-xs font-semibold uppercase tracking-wide mb-5">For Teachers</p>
              <div className="space-y-5">
                {TEACHER_STEPS.map((item, i) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-ink-50 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-ink-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-950 text-sm mb-0.5">{i + 1}. {item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!user && (
                <Link href="/register/teacher" className="inline-flex items-center gap-2 text-ink-700 font-medium text-sm hover:text-ink-900 transition mt-6">
                  Create your teacher profile <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {user?.role === "teacher" && (
                <Link href="/jobs" className="inline-flex items-center gap-2 text-ink-700 font-medium text-sm hover:text-ink-900 transition mt-6">
                  Browse jobs <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
              <p className="text-brass-600 text-xs font-semibold uppercase tracking-wide mb-5">For Schools</p>
              <div className="space-y-5">
                {SCHOOL_STEPS.map((item, i) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-brass-50 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-brass-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-950 text-sm mb-0.5">{i + 1}. {item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!user && (
                <Link href="/register/school" className="inline-flex items-center gap-2 text-brass-700 font-medium text-sm hover:text-brass-800 transition mt-6">
                  Register your school <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {user?.role === "school" && (
                <Link href="/dashboard/school/post-job" className="inline-flex items-center gap-2 text-brass-700 font-medium text-sm hover:text-brass-800 transition mt-6">
                  Post a job now <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 max-w-xl">
            <h2 className="font-display text-3xl text-ink-950">Everything you need to hire, or get hired</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-3.5">
                  <f.icon className="h-5 w-5 text-ink-700" />
                </div>
                <h3 className="font-semibold text-ink-950 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-20 px-4 bg-ink-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl mb-4">
            {user ? `Welcome back, ${user.display_name?.split(" ")[0] || "there"}.` : "Ready to get started?"}
          </h2>
          <p className="text-ink-200 mb-8 text-lg">
            {user?.role === "teacher"
              ? "Continue browsing jobs or complete your profile to stand out."
              : user?.role === "school"
              ? "Post your next vacancy or browse the teacher talent pool."
              : "Join the schools and teachers already hiring properly on ClassHire."}
          </p>
          <BottomCTA user={user} />
        </div>
      </section>

    </div>
  )
}
