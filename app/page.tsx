"use client"

import Link from "next/link"
import {
  GraduationCap, Search, FileCheck, Building2, MapPin,
  CheckCircle2, BookOpen, Shield, Zap, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const { user, isLoading, dashboardLink } = useAuth()

  const HeroCTAs = () => {
    if (isLoading) return <div className="h-14 w-64 bg-green-100 rounded-xl animate-pulse mx-auto" />
    if (user?.role === "teacher") return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/jobs">
          <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base">
            <Search className="h-5 w-5 mr-2" />Browse Teaching Jobs
          </Button>
        </Link>
        <Link href={dashboardLink}>
          <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-base">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    )
    if (user?.role === "school") return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/dashboard/school/post-job">
          <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base">
            <Building2 className="h-5 w-5 mr-2" />Post a Job
          </Button>
        </Link>
        <Link href="/talent">
          <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-base">
            Browse Teachers
          </Button>
        </Link>
      </div>
    )
    // Guest
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/register/teacher">
          <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base">
            <Search className="h-5 w-5 mr-2" />Find Teaching Jobs
          </Button>
        </Link>
        <Link href="/register/school">
          <Button size="lg" className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-base">
            <Building2 className="h-5 w-5 mr-2" />Hire Qualified Teachers
          </Button>
        </Link>
      </div>
    )
  }

  const BottomCTA = () => {
    if (user?.role === "teacher") return (
      <Link href="/jobs">
        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base">
          Browse Jobs Now
        </Button>
      </Link>
    )
    if (user?.role === "school") return (
      <Link href="/dashboard/school/post-job">
        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base">
          Post a Job
        </Button>
      </Link>
    )
    return (
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/register/teacher">
          <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base">
            Join as a Teacher
          </Button>
        </Link>
        <Link href="/register/school">
          <Button size="lg" className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-6 text-base">
            Register Your School
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Shield className="h-3.5 w-3.5" />
              Built exclusively for Nigerian schools & teachers
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Teacher Hiring,{" "}
              <span className="text-green-600">Done Right.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              Schools post vacancies with built-in subject quizzes — only teachers who pass reach your inbox.
              No more CV piles. No more guesswork.
            </p>
            <p className="text-base text-gray-500 mb-10">
              Teachers: upload your CV once and get matched to schools actively looking for your subject and level.
            </p>
            <HeroCTAs />
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-gray-900 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon: Clock,         stat: "Weeks",         label: "wasted on CVs that go nowhere",              color: "text-red-400"   },
            { icon: Zap,           stat: "One Quiz",      label: "screens out unqualified applicants instantly", color: "text-green-400" },
            { icon: CheckCircle2,  stat: "Only the best", label: "candidates reach your hiring pipeline",        color: "text-blue-400"  },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-3">
              <item.icon className={`h-7 w-7 ${item.color}`} />
              <p className={`text-2xl font-bold ${item.color}`}>{item.stat}</p>
              <p className="text-sm text-gray-400 leading-snug">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works — Teachers */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-green-600 text-sm font-semibold uppercase tracking-wide mb-2">For Teachers</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your next job is three steps away</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              No recruiters, no middlemen. Apply directly to verified Nigerian schools.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: FileCheck,     title: "Build your profile",       desc: "Upload your CV, add your subjects, teaching levels, and TRCN status. Takes 5 minutes.", step: "01" },
              { icon: Search,        title: "Browse & apply",           desc: "Filter jobs by subject, level, location and salary. Apply in one click.",               step: "02" },
              { icon: GraduationCap, title: "Pass the quiz (if any)",   desc: "Some schools include a subject quiz. Pass it and your application goes straight to the top.", step: "03" },
            ].map((item) => (
              <div key={item.title} className="relative p-6 bg-gray-50 rounded-2xl">
                <div className="absolute top-4 right-4 text-5xl font-black text-gray-100">{item.step}</div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          {!user && (
            <div className="text-center mt-10">
              <Link href="/register/teacher">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-8">
                  Create Teacher Profile
                </Button>
              </Link>
            </div>
          )}
          {user?.role === "teacher" && (
            <div className="text-center mt-10">
              <Link href="/jobs">
                <Button className="bg-green-600 hover:bg-green-700 text-white px-8">
                  Browse Jobs
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works — Schools */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-2">For Schools</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hire faster. Hire better.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Post a job in minutes, let the quiz filter for you, and only meet candidates who are qualified.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Building2, title: "Post your vacancy",      desc: "Describe the role, set the salary, choose a subject quiz. Live in under 5 minutes.",             step: "01" },
              { icon: Zap,       title: "Quiz does the screening", desc: "Only teachers who pass your subject quiz at your required score appear in your pipeline.",        step: "02" },
              { icon: MapPin,    title: "Review & hire",          desc: "Browse ranked applicants, view full profiles and CVs, and move candidates through your pipeline.", step: "03" },
            ].map((item) => (
              <div key={item.title} className="relative p-6 bg-white rounded-2xl border border-gray-200">
                <div className="absolute top-4 right-4 text-5xl font-black text-gray-100">{item.step}</div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          {!user && (
            <div className="text-center mt-10">
              <Link href="/register/school">
                <Button className="bg-blue-700 hover:bg-blue-800 text-white px-8">
                  Register Your School
                </Button>
              </Link>
            </div>
          )}
          {user?.role === "school" && (
            <div className="text-center mt-10">
              <Link href="/dashboard/school/post-job">
                <Button className="bg-blue-700 hover:bg-blue-800 text-white px-8">
                  Post a Job Now
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to hire or get hired</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BookOpen,     title: "Subject Mastery Quiz",   desc: "Teachers prove their knowledge. Schools get a percentile rank on every applicant."    },
              { icon: FileCheck,    title: "CV Parsing",             desc: "Upload once. We extract your experience, subjects, and skills automatically."         },
              { icon: CheckCircle2, title: "TRCN Verification",      desc: "Teachers show their registration status. Schools can filter for registered teachers." },
              { icon: MapPin,       title: "Location Matching",      desc: "Filter by state and LGA. Find opportunities — or talent — right in your area."       },
              { icon: Zap,          title: "Instant Screening",      desc: "No more reading 200 CVs. The quiz does the first round for you automatically."        },
              { icon: Shield,       title: "Verified Profiles",      desc: "Every school and teacher profile is tied to a verified account."                     },
            ].map((f) => (
              <div key={f.title} className="p-5 border border-gray-200 rounded-2xl hover:border-green-300 hover:shadow-sm transition">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <f.icon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-600 to-green-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            {user ? `Welcome back, ${user.display_name.split(" ")[0]}!` : "Ready to get started?"}
          </h2>
          <p className="text-green-100 mb-8 text-lg">
            {user?.role === "teacher"
              ? "Continue browsing jobs or complete your profile to stand out."
              : user?.role === "school"
              ? "Post your next vacancy or browse the teacher talent pool."
              : "Join thousands of teachers and schools already on TeachConnect."}
          </p>
          <BottomCTA />
        </div>
      </section>

    </div>
  )
}
