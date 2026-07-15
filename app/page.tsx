"use client"

import Link from "next/link"
import {
  Search, FileCheck, Building2, MapPin,
  CheckCircle2, BookOpen, Shield, Clock, ArrowRight, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

// ─── Signature hero visual — the actual product mechanic, not a
// decorative illustration: quiz scores rank applicants automatically,
// so a school opens a short, ordered shortlist instead of a CV pile. ──
function RankingCard() {
  const rows = [
    { name: "Chidinma A.", subject: "Mathematics", score: 94, top: true },
    { name: "Tunde O.",    subject: "Mathematics", score: 88, top: false },
    { name: "Ngozi E.",    subject: "Mathematics", score: 81, top: false },
  ]
  return (
    <div className="relative w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-ink-100 shadow-xl shadow-ink-900/5 p-5">
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
      {/* Contrast callout — the "before" this replaces */}
      <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-2 bg-white rounded-xl border border-gray-200 shadow-lg px-4 py-3">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
          <X className="h-3.5 w-3.5 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 leading-tight">
          No more<br /><span className="font-medium text-gray-700">200-CV inbox</span>
        </p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user, isLoading, dashboardLink } = useAuth()

  const HeroCTAs = () => {
    if (isLoading) return <div className="h-14 w-64 bg-ink-100 rounded-xl animate-pulse" />
    if (user?.role === "teacher") return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/jobs">
          <Button size="lg" className="w-full sm:w-auto bg-ink-800 hover:bg-ink-900 text-white px-7 py-6 text-base rounded-xl">
            <Search className="h-5 w-5 mr-2" />Browse Teaching Jobs
          </Button>
        </Link>
        <Link href={dashboardLink}>
          <Button size="lg" variant="outline" className="w-full sm:w-auto px-7 py-6 text-base rounded-xl border-ink-200">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    )
    if (user?.role === "school") return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard/school/post-job">
          <Button size="lg" className="w-full sm:w-auto bg-ink-800 hover:bg-ink-900 text-white px-7 py-6 text-base rounded-xl">
            <Building2 className="h-5 w-5 mr-2" />Post a Job
          </Button>
        </Link>
        <Link href="/talent">
          <Button size="lg" variant="outline" className="w-full sm:w-auto px-7 py-6 text-base rounded-xl border-ink-200">
            Browse Teachers
          </Button>
        </Link>
      </div>
    )
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/register/teacher">
          <Button size="lg" className="w-full sm:w-auto bg-ink-800 hover:bg-ink-900 text-white px-7 py-6 text-base rounded-xl">
            <Search className="h-5 w-5 mr-2" />Find Teaching Jobs
          </Button>
        </Link>
        <Link href="/register/school">
          <Button size="lg" variant="outline" className="w-full sm:w-auto px-7 py-6 text-base rounded-xl border-ink-200">
            <Building2 className="h-5 w-5 mr-2" />Hire Qualified Teachers
          </Button>
        </Link>
      </div>
    )
  }

  const BottomCTA = () => {
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
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/register/teacher">
          <Button size="lg" className="bg-white text-ink-900 hover:bg-brass-50 px-8 py-6 text-base rounded-xl">
            Join as a Teacher
          </Button>
        </Link>
        <Link href="/register/school">
          <Button size="lg" variant="outline" className="border-ink-400 text-white hover:bg-ink-800 px-8 py-6 text-base rounded-xl">
            Register Your School
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col">

      {/* Hero — asymmetric: thesis statement on the left, the actual
          screening mechanic shown (not described) on the right. */}
      <section className="bg-white pt-16 pb-24 px-4 sm:pt-20 sm:pb-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-ink-700 text-xs font-semibold uppercase tracking-wide mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-brass-500" />
              Built for Nigerian schools & teachers
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] text-ink-950 leading-[1.08] mb-6">
              Teacher hiring,<br />
              <span className="italic text-ink-600">done properly.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-3 leading-relaxed max-w-lg">
              Schools post vacancies with a built-in subject quiz — only teachers who pass reach the shortlist.
            </p>
            <p className="text-base text-gray-500 mb-10 max-w-lg">
              Teachers build a profile once and get matched to schools hiring for their subject and level.
            </p>
            <HeroCTAs />
          </div>

          <div className="flex justify-center lg:justify-end">
            <RankingCard />
          </div>
        </div>
      </section>

      {/* The old way vs. the ClassHire way — a real comparison, not a
          decorative stat strip. */}
      <section className="bg-ink-950 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ink-800 rounded-2xl overflow-hidden">
            <div className="bg-ink-950 p-8">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">The old way</p>
              <ul className="space-y-3">
                {[
                  "Weeks spent opening CVs that go nowhere",
                  "No way to verify a claimed subject skill",
                  "Interviews before you know who's qualified",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-gray-400">
                    <Clock className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
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

      {/* How It Works — Teachers */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-xl">
            <p className="text-ink-600 text-sm font-semibold uppercase tracking-wide mb-3">For Teachers</p>
            <h2 className="font-display text-3xl text-ink-950 mb-3">Your next job is three steps away</h2>
            <p className="text-gray-500">
              No recruiters, no middlemen. Apply directly to verified Nigerian schools.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10 relative">
            <div className="hidden md:block absolute top-6 left-[16.5%] right-[16.5%] h-px bg-gray-200" />
            {[
              { icon: FileCheck, title: "Build your profile", desc: "Upload your CV, add your subjects, teaching levels, and TRCN status. Takes 5 minutes." },
              { icon: Search,    title: "Browse & apply",     desc: "Filter jobs by subject, level, location and salary. Apply in one click." },
              { icon: BookOpen,  title: "Pass the quiz",      desc: "Some schools include a subject quiz. Pass it and your application rises to the top." },
            ].map((item, i) => (
              <div key={item.title} className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative z-10 w-12 h-12 bg-white border-2 border-ink-800 rounded-full flex items-center justify-center">
                    <span className="font-display text-sm text-ink-800">{i + 1}</span>
                  </div>
                </div>
                <item.icon className="h-5 w-5 text-ink-500 mb-3" />
                <h3 className="font-semibold text-ink-950 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          {!user && (
            <div className="mt-12">
              <Link href="/register/teacher" className="inline-flex items-center gap-2 text-ink-700 font-medium hover:text-ink-900 transition">
                Create your teacher profile <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
          {user?.role === "teacher" && (
            <div className="mt-12">
              <Link href="/jobs" className="inline-flex items-center gap-2 text-ink-700 font-medium hover:text-ink-900 transition">
                Browse jobs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works — Schools */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-xl">
            <p className="text-brass-600 text-sm font-semibold uppercase tracking-wide mb-3">For Schools</p>
            <h2 className="font-display text-3xl text-ink-950 mb-3">Hire faster. Hire better.</h2>
            <p className="text-gray-500">
              Post a job in minutes, let the quiz filter for you, and only meet candidates who are qualified.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10 relative">
            <div className="hidden md:block absolute top-6 left-[16.5%] right-[16.5%] h-px bg-gray-300" />
            {[
              { icon: Building2, title: "Post your vacancy",       desc: "Describe the role, set the salary, choose a subject quiz. Live in under 5 minutes." },
              { icon: Shield,    title: "Quiz does the screening", desc: "Only teachers who pass your subject quiz at your required score appear in your pipeline." },
              { icon: MapPin,    title: "Review & hire",           desc: "Browse ranked applicants, view full profiles and CVs, and move candidates through your pipeline." },
            ].map((item, i) => (
              <div key={item.title} className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative z-10 w-12 h-12 bg-gray-50 border-2 border-brass-500 rounded-full flex items-center justify-center">
                    <span className="font-display text-sm text-brass-700">{i + 1}</span>
                  </div>
                </div>
                <item.icon className="h-5 w-5 text-brass-600 mb-3" />
                <h3 className="font-semibold text-ink-950 mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          {!user && (
            <div className="mt-12">
              <Link href="/register/school" className="inline-flex items-center gap-2 text-brass-700 font-medium hover:text-brass-800 transition">
                Register your school <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
          {user?.role === "school" && (
            <div className="mt-12">
              <Link href="/dashboard/school/post-job" className="inline-flex items-center gap-2 text-brass-700 font-medium hover:text-brass-800 transition">
                Post a job now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-xl">
            <h2 className="font-display text-3xl text-ink-950">Everything you need to hire, or get hired</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {[
              { icon: BookOpen,     title: "Subject Mastery Quiz", desc: "Teachers prove their knowledge. Schools get a percentile rank on every applicant." },
              { icon: FileCheck,    title: "CV Parsing",           desc: "Upload once. We extract your experience, subjects, and skills automatically." },
              { icon: CheckCircle2, title: "TRCN Verification",    desc: "Teachers show their registration status. Schools can filter for registered teachers." },
              { icon: MapPin,       title: "Location Matching",    desc: "Filter by state and LGA. Find opportunities — or talent — right in your area." },
              { icon: Shield,       title: "Verified Profiles",    desc: "Every school and teacher profile is tied to a verified account." },
              { icon: Search,       title: "Direct Applications",  desc: "No recruiters or middlemen. Teachers and schools deal with each other directly." },
            ].map((f) => (
              <div key={f.title} className="pt-5 border-t-2 border-ink-900">
                <f.icon className="h-5 w-5 text-ink-700 mb-3" />
                <h3 className="font-semibold text-ink-950 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 bg-ink-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl mb-4">
            {user ? `Welcome back, ${user.display_name.split(" ")[0]}.` : "Ready to get started?"}
          </h2>
          <p className="text-ink-200 mb-8 text-lg">
            {user?.role === "teacher"
              ? "Continue browsing jobs or complete your profile to stand out."
              : user?.role === "school"
              ? "Post your next vacancy or browse the teacher talent pool."
              : "Join the schools and teachers already hiring properly on ClassHire."}
          </p>
          <BottomCTA />
        </div>
      </section>

    </div>
  )
}
