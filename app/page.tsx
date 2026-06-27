import Link from "next/link"
import {
  GraduationCap,
  Search,
  FileCheck,
  Building2,
  MapPin,
  CheckCircle2,
  BookOpen,
  Shield,
  Zap,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register/teacher">
                <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base">
                  <Search className="h-5 w-5 mr-2" />
                  Find Teaching Jobs
                </Button>
              </Link>
              <Link href="/register/school">
                <Button size="lg" className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-base">
                  <Building2 className="h-5 w-5 mr-2" />
                  Hire Qualified Teachers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution Banner */}
      <section className="bg-gray-900 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon: Clock, stat: "Weeks", label: "wasted on CVs that go nowhere", color: "text-red-400" },
            { icon: Zap, stat: "One Quiz", label: "screens out unqualified applicants instantly", color: "text-green-400" },
            { icon: CheckCircle2, stat: "Only the best", label: "candidates reach your hiring pipeline", color: "text-blue-400" },
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
              One profile. Every qualifying school in Nigeria can find you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: GraduationCap,
                title: "Upload Your CV",
                description: "We extract your qualifications, subjects, teaching levels, and experience automatically. Your profile is ready in minutes.",
                color: "bg-green-50 text-green-600",
              },
              {
                step: "02",
                icon: Search,
                title: "Browse & Apply",
                description: "Filter jobs by subject, state, salary range, and whether accommodation is offered. Apply to the ones that fit your life.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                step: "03",
                icon: FileCheck,
                title: "Pass the Quiz, Get the Job",
                description: "Each vacancy has a short subject test. Pass it and your application goes straight to the top of the school's list.",
                color: "bg-purple-50 text-purple-600",
              },
            ].map((item) => (
              <div key={item.step} className="relative p-8 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all">
                <div className="absolute top-6 right-6 text-4xl font-black text-gray-100">{item.step}</div>
                <div className={`inline-flex p-3 rounded-xl mb-5 ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/register/teacher">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8">
                Create Your Teacher Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works — Schools */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-2">For Schools</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Stop reading CVs. Start hiring.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Set a pass mark. Only teachers who meet it reach your inbox — already ranked by score.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Building2,
                title: "Register Your School",
                description: "Add your school type, levels taught, location, and what you're looking for. Takes less than 5 minutes.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                step: "02",
                icon: FileCheck,
                title: "Post a Vacancy with a Quiz",
                description: "Select a subject quiz and set your minimum pass mark. Teachers below the threshold are automatically filtered out.",
                color: "bg-green-50 text-green-600",
              },
              {
                step: "03",
                icon: CheckCircle2,
                title: "Review & Hire with Confidence",
                description: "See each applicant's quiz score, TRCN status, years of experience, and subject depth — before you even pick up the phone.",
                color: "bg-yellow-50 text-yellow-600",
              },
            ].map((item) => (
              <div key={item.step} className="relative p-8 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all">
                <div className="absolute top-6 right-6 text-4xl font-black text-gray-100">{item.step}</div>
                <div className={`inline-flex p-3 rounded-xl mb-5 ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/register/school">
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8">
                Register Your School
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why TeachConnect */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why TeachConnect is Different</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Every feature was built around one reality: finding the right teacher in Nigeria is hard. We make it easier.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Quiz-Gated Applications",
                description: "Teachers take a subject knowledge test before applying. You set the pass mark — weak candidates never reach you.",
                icon: FileCheck,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                title: "Accommodation-Inclusive Jobs",
                description: "Schools in underserved areas can offer housing. Teachers open to relocation can filter specifically for these roles.",
                icon: MapPin,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                title: "TRCN Status on Every Profile",
                description: "Teachers display their registration status upfront. No more discovering during onboarding that your new hire isn't TRCN-registered.",
                icon: Shield,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                title: "Private Vacancy Posting",
                description: "Replacing a current staff member? Post the role privately — only matched teachers see it, not your existing team or the wider public.",
                icon: Building2,
                color: "text-yellow-600",
                bg: "bg-yellow-50",
              },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:shadow-sm transition">
                <div className={`flex-shrink-0 p-3 rounded-xl h-fit ${feature.bg}`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accommodation Banner */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-green-200" />
                <span className="text-green-200 text-sm font-medium">Jobs With Accommodation</span>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Open to relocating? Find schools that include a home.
              </h2>
              <p className="text-green-100 leading-relaxed">
                Schools outside the major cities are actively hiring — and many offer free or subsidised accommodation.
                If you're willing to move, these roles pay well and come with housing included.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/jobs?accommodation=true">
                <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 px-8">
                  <MapPin className="h-5 w-5 mr-2" />
                  View Jobs With Accommodation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Resources for Teachers</h2>
            <p className="text-gray-500">Practical guides to help you get hired and grow your career</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "TRCN Registration Guide",
                description: "A clear, step-by-step walkthrough of how to register with the Teachers Registration Council of Nigeria — including fees, documents, and timelines.",
                tag: "Guide",
                tagColor: "bg-green-100 text-green-700",
              },
              {
                icon: FileCheck,
                title: "Teacher CV Template",
                description: "A professionally structured CV template built for Nigerian teachers. Covers subjects, levels, certifications, and the details schools actually look for.",
                tag: "Download",
                tagColor: "bg-blue-100 text-blue-700",
              },
              {
                icon: GraduationCap,
                title: "Teacher Salary Guide 2025",
                description: "What should you be earning? Salary ranges by state, school type, teaching level, and subject — so you know your worth before negotiating.",
                tag: "Article",
                tagColor: "bg-purple-100 text-purple-700",
              },
            ].map((resource) => (
              <div key={resource.title} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <resource.icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${resource.tagColor}`}>
                    {resource.tag}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{resource.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/resources">
              <Button variant="outline" className="px-8">View All Resources</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Whether you're a teacher looking for your next role or a school tired of sifting through CVs — TeachConnect was built for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/teacher">
              <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8">
                I'm a Teacher
              </Button>
            </Link>
            <Link href="/register/school">
              <Button size="lg" className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 px-8">
                I Represent a School
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
