import Link from "next/link"
import {
  GraduationCap,
  Search,
  FileCheck,
  Building2,
  MapPin,
  CheckCircle2,
  Star,
  Users,
  Briefcase,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 via-white to-blue-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Star className="h-3.5 w-3.5" />
              Nigeria's First Dedicated Teacher Recruitment Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Find the Right Teacher.{" "}
              <span className="text-green-600">Every Time.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Schools get pre-screened, qualified teachers. Teachers find
              opportunities that match their skills. Nigeria's only recruitment
              platform built exclusively for education.
            </p>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register/teacher">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Find Teaching Jobs
                </Button>
              </Link>
              <Link href="/register/school">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white px-8 py-6 text-base"
                >
                  <Building2 className="h-5 w-5 mr-2" />
                  Hire Qualified Teachers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-900 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              {
                icon: Users,
                value: "2,400+",
                label: "Teachers Registered",
                color: "text-green-400",
              },
              {
                icon: Building2,
                value: "180+",
                label: "Schools Hiring",
                color: "text-blue-400",
              },
              {
                icon: MapPin,
                value: "30+",
                label: "States Covered",
                color: "text-yellow-400",
              },
              {
                icon: Briefcase,
                value: "450+",
                label: "Jobs Posted",
                color: "text-purple-400",
              },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <stat.icon className={`h-6 w-6 mb-2 ${stat.color}`} />
                <div className="text-2xl md:text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Teachers */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works for Teachers
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Get matched with schools looking for your exact skills and
              subject area
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: GraduationCap,
                title: "Create Your Profile",
                description:
                  "Upload your CV and let our system automatically build your teaching profile. Add your subjects, levels, and location preferences.",
                color: "bg-green-50 text-green-600",
              },
              {
                step: "02",
                icon: Search,
                title: "Browse & Apply",
                description:
                  "Search jobs by subject, level, state, and salary. Filter for schools offering accommodation if you're open to relocation.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                step: "03",
                icon: FileCheck,
                title: "Take the Quiz & Get Hired",
                description:
                  "Complete a short subject quiz before applying. Schools see your score and only the best candidates move forward.",
                color: "bg-purple-50 text-purple-600",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-8 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all"
              >
                <div className="absolute top-6 right-6 text-4xl font-black text-gray-100">
                  {item.step}
                </div>
                <div
                  className={`inline-flex p-3 rounded-xl mb-5 ${item.color}`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/register/teacher">
              <Button className="bg-green-600 hover:bg-green-700 text-white px-8">
                Create Teacher Profile
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works — Schools */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works for Schools
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Stop sifting through hundreds of unqualified CVs. Receive only
              candidates who passed your screening test.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Building2,
                title: "Register Your School",
                description:
                  "Create your school profile in minutes. Add your school type, levels taught, location, and contact information.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                step: "02",
                icon: FileCheck,
                title: "Post a Vacancy with a Quiz",
                description:
                  "Describe the role and select a subject quiz. Set your minimum pass mark — only teachers who pass will reach your inbox.",
                color: "bg-green-50 text-green-600",
              },
              {
                step: "03",
                icon: CheckCircle2,
                title: "Review & Hire",
                description:
                  "Browse pre-screened applicants with quiz scores visible. Move candidates through your hiring pipeline and hire with confidence.",
                color: "bg-yellow-50 text-yellow-600",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-8 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="absolute top-6 right-6 text-4xl font-black text-gray-100">
                  {item.step}
                </div>
                <div
                  className={`inline-flex p-3 rounded-xl mb-5 ${item.color}`}
                >
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/register/school">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white px-8">
                Register Your School
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why TeachConnect is Different
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Subject Knowledge Screening",
                description:
                  "Every applicant takes a subject-specific quiz before reaching the school. You set the pass mark.",
                icon: FileCheck,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                title: "Jobs With Accommodation",
                description:
                  "Schools in underserved areas can offer accommodation, opening a wider pool of willing teachers.",
                icon: MapPin,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                title: "Discreet Private Postings",
                description:
                  "Post a vacancy privately — only matched teachers see it, not your current staff or the public.",
                icon: Building2,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                title: "TRCN Verified Profiles",
                description:
                  "Teachers can display their TRCN registration status giving schools instant trust signals.",
                icon: CheckCircle2,
                color: "text-yellow-600",
                bg: "bg-yellow-50",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex gap-5 p-6 rounded-2xl border border-gray-100 hover:shadow-sm transition"
              >
                <div
                  className={`flex-shrink-0 p-3 rounded-xl h-fit ${feature.bg}`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accommodation Banner */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-green-200" />
                <span className="text-green-200 text-sm font-medium">
                  Teaching Jobs With Accommodation
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Open to Relocating? Find Schools That Offer a Home.
              </h2>
              <p className="text-green-100 leading-relaxed">
                Hundreds of schools outside Lagos and Abuja are actively
                seeking quality teachers and offering free or subsidised
                accommodation as part of the package.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link href="/jobs?accommodation=true">
                <Button
                  size="lg"
                  className="bg-white text-green-700 hover:bg-green-50 px-8"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  View Jobs With Accommodation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Teaser */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Resources for Teachers
            </h2>
            <p className="text-gray-500">
              Everything you need to advance your teaching career
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "TRCN Registration Guide",
                description:
                  "Step by step guide to registering with the Teachers Registration Council of Nigeria.",
                tag: "Guide",
                tagColor: "bg-green-100 text-green-700",
              },
              {
                icon: FileCheck,
                title: "Teacher CV Template",
                description:
                  "A professional CV template designed specifically for Nigerian teachers at all levels.",
                tag: "Download",
                tagColor: "bg-blue-100 text-blue-700",
              },
              {
                icon: GraduationCap,
                title: "Salary Guide 2025",
                description:
                  "Average teacher salaries by state, school type, and subject across Nigeria.",
                tag: "Article",
                tagColor: "bg-purple-100 text-purple-700",
              },
            ].map((resource) => (
              <div
                key={resource.title}
                className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gray-100 p-3 rounded-xl">
                    <resource.icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${resource.tagColor}`}
                  >
                    {resource.tag}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">
                  {resource.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {resource.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/resources">
              <Button variant="outline" className="px-8">
                View All Resources
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Join thousands of teachers and schools already using
            TeachConnect to make better hiring decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/teacher">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8"
              >
                I am a Teacher
              </Button>
            </Link>
            <Link href="/register/school">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white px-8"
              >
                I represent a School
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}