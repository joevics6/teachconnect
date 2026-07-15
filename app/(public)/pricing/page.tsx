"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  X,
  Star,
  Zap,
  Building2,
  HelpCircle,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Types ───────────────────────────────────────────────────

interface Plan {
  id: string
  name: string
  price: number | null
  period: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  buttonColor: string
  badge?: string
  features: string[]
  limitations?: string[]
}

// ─── Plans Data ───────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Get started and explore the platform at no cost.",
    icon: Building2,
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    buttonColor: "bg-gray-700 hover:bg-gray-800",
    features: [
      "1 job posting per month",
      "In-app applications",
      "Basic applicant list",
      "View first 5 teacher profiles",
      "School public profile page",
    ],
    limitations: [
      "No quiz screening",
      "No talent browsing beyond 5 profiles",
      "No direct messaging",
      "No featured listings",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 15000,
    period: "per posting",
    description: "Perfect for schools that hire occasionally.",
    icon: Star,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    buttonColor: "bg-blue-700 hover:bg-blue-800",
    badge: "Most Popular",
    features: [
      "Single job posting (30 days)",
      "Quiz screening (all 3 modes)",
      "Full applicant pipeline",
      "Download applicant CVs",
      "Private posting option",
      "Applicant notes",
      "Email notifications",
    ],
    limitations: [
      "No talent page access",
      "No direct messaging",
    ],
  },
  {
    id: "term",
    name: "Term Plan",
    price: 75000,
    period: "per term",
    description: "Best value for schools hiring every term.",
    icon: Zap,
    color: "text-ink-700",
    bgColor: "bg-ink-50",
    borderColor: "border-ink-300",
    buttonColor: "bg-ink-600 hover:bg-ink-700",
    badge: "Best Value",
    features: [
      "Unlimited postings for one term",
      "All Standard features included",
      "Full talent page access",
      "Direct messaging to teachers",
      "1 featured listing included",
      "Priority support",
      "Verified school badge",
      "Analytics dashboard",
    ],
  },
]

const FAQS = [
  {
    question: "What is a school term in this context?",
    answer:
      "A school term is defined as approximately 13 weeks (one Nigerian academic term). The Term Plan gives you unlimited postings for that full period, making it ideal if you're hiring multiple teachers at once.",
  },
  {
    question: "Can I upgrade from Standard to Term Plan?",
    answer:
      "Yes. If you have purchased a Standard posting and want to upgrade to the Term Plan, contact us and we will credit the amount paid toward your Term Plan subscription.",
  },
  {
    question: "How does quiz screening work?",
    answer:
      "When you post a job with quiz screening enabled, teachers must complete and pass a subject-specific quiz before their application reaches your inbox. You set the pass mark. Only teachers who meet your threshold are shown to you.",
  },
  {
    question: "What are the three quiz modes?",
    answer:
      "Standard Quiz — fixed questions with a time limit, multiple choice. Speed Quiz — answer as many questions as possible in 5, 10, or 20 minutes. Written Quiz — open-ended questions graded by AI with individual feedback per answer.",
  },
  {
    question: "How do I pay?",
    answer:
      "Payment is processed securely via Paystack. You can pay with any Nigerian debit card, bank transfer, or USSD. All amounts are in Nigerian Naira.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "Standard postings are non-refundable once your job is published. Term Plans can be refunded within 7 days if no postings have been made. Contact support for assistance.",
  },
  {
    question: "Can teachers apply without taking a quiz?",
    answer:
      "Yes — quiz screening is optional. You can post a job without it and receive all applicants directly. We recommend enabling it for better quality filtering.",
  },
  {
    question: "What is the talent page?",
    answer:
      "The talent page lets you browse registered teacher profiles directly and send invitations to apply for your open roles — without waiting for them to find your listing. This is available on the Term Plan.",
  },
]

// ─── FAQ Item ─────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition"
      >
        <span className="font-medium text-gray-900 text-sm pr-4">
          {question}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 bg-white">
          <p className="text-sm text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

// ─── Plan Card ────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrentPlan,
}: {
  plan: Plan
  isCurrentPlan?: boolean
}) {
  const Icon = plan.icon
  const isFree = plan.id === "free"

  return (
    <div
      className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${plan.borderColor} ${
        plan.badge ? "shadow-md" : ""
      }`}
    >
      {/* Badge */}
      {plan.badge && (
        <div
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white ${
            plan.id === "standard" ? "bg-blue-600" : "bg-ink-600"
          }`}
        >
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div
          className={`inline-flex p-2.5 rounded-xl mb-4 ${plan.bgColor}`}
        >
          <Icon className={`h-5 w-5 ${plan.color}`} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        {plan.price === 0 ? (
          <div>
            <span className="text-4xl font-black text-gray-900">Free</span>
          </div>
        ) : (
          <div>
            <span className="text-4xl font-black text-gray-900">
              ₦{plan.price?.toLocaleString() ?? '—'}
            </span>
            <span className="text-gray-400 text-sm ml-2">{plan.period}</span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mb-6">
        {isCurrentPlan ? (
          <div className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-center text-sm font-semibold text-gray-500">
            Current Plan
          </div>
        ) : isFree ? (
          <Link href="/register/school">
            <Button
              className={`w-full text-white ${plan.buttonColor}`}
            >
              Get Started Free
            </Button>
          </Link>
        ) : (
          <Link href={`/dashboard/school/subscription?plan=${plan.id}`}>
            <Button
              className={`w-full text-white ${plan.buttonColor}`}
            >
              {plan.id === "standard" ? "Buy Posting" : "Subscribe Now"}
            </Button>
          </Link>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mb-5" />

      {/* Features */}
      <div className="space-y-3 flex-1">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2.5">
            <CheckCircle2
              className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                plan.id === "free"
                  ? "text-gray-500"
                  : plan.id === "standard"
                  ? "text-blue-600"
                  : "text-ink-600"
              }`}
            />
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
        {plan.limitations?.map((limitation) => (
          <div key={limitation} className="flex items-start gap-2.5">
            <X className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-400">{limitation}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Comparison Table ─────────────────────────────────────────

const COMPARISON_ROWS = [
  { feature: "Job postings", free: "1/month", standard: "1 posting", term: "Unlimited" },
  { feature: "Quiz screening", free: false, standard: true, term: true },
  { feature: "Quiz modes", free: false, standard: "All 3 modes", term: "All 3 modes" },
  { feature: "Applicant pipeline", free: "Basic", standard: "Full", term: "Full" },
  { feature: "Download CVs", free: false, standard: true, term: true },
  { feature: "Private postings", free: false, standard: true, term: true },
  { feature: "Talent page access", free: "5 profiles", standard: false, term: "Unlimited" },
  { feature: "Direct messaging", free: false, standard: false, term: true },
  { feature: "Featured listings", free: false, standard: "Add-on", term: "1 included" },
  { feature: "Verified school badge", free: false, standard: false, term: true },
  { feature: "Analytics", free: false, standard: false, term: true },
  { feature: "Priority support", free: false, standard: false, term: true },
]

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle2 className="h-5 w-5 text-ink-500 mx-auto" />
  if (value === false) return <X className="h-4 w-4 text-gray-300 mx-auto" />
  return <span className="text-sm text-gray-700 text-center block">{value}</span>
}

// ─── Main Page ────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-white border-b border-gray-200 py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ink-100 text-ink-700 text-sm font-medium rounded-full mb-6">
            <Star className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-4">
            Hire Better Teachers,{" "}
            <span className="text-ink-600">Pay Only for What You Need</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            No subscriptions required to get started. Pay per posting or
            subscribe for the full term. All plans include our unique quiz
            screening system.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* For Teachers Banner */}
        <div className="bg-gradient-to-r from-ink-600 to-ink-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-16">
          <div className="text-white">
            <h3 className="font-bold text-xl mb-1">
              Are you a teacher? It&apos;s completely free.
            </h3>
            <p className="text-ink-100 text-sm">
              Create your profile, browse jobs, take quizzes and apply — all
              at no cost, forever.
            </p>
          </div>
          <Link href="/register/teacher" className="flex-shrink-0">
            <Button className="bg-white text-ink-700 hover:bg-ink-50 px-6">
              Create Free Profile
            </Button>
          </Link>
        </div>

        {/* Comparison Table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Full Feature Comparison
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 w-1/2">
                      Feature
                    </th>
                    <th className="text-center px-4 py-4 text-sm font-semibold text-gray-700">
                      Free
                    </th>
                    <th className="text-center px-4 py-4 text-sm font-semibold text-blue-700 bg-blue-50">
                      Standard
                    </th>
                    <th className="text-center px-4 py-4 text-sm font-semibold text-ink-700">
                      Term Plan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-gray-50 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-6 py-3.5 text-sm text-gray-700 font-medium">
                        {row.feature}
                      </td>
                      <td className="px-4 py-3.5">
                        <ComparisonCell value={row.free} />
                      </td>
                      <td className="px-4 py-3.5 bg-blue-50/30">
                        <ComparisonCell value={row.standard} />
                      </td>
                      <td className="px-4 py-3.5">
                        <ComparisonCell value={row.term} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add-ons */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Optional Add-ons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                title: "Featured Listing",
                price: "₦10,000",
                period: "per posting",
                description:
                  "Pin your job to the top of search results for maximum visibility. Ideal for urgent or competitive roles.",
                color: "text-yellow-600",
                bg: "bg-yellow-50",
                border: "border-yellow-200",
              },
              {
                title: "Extended Posting",
                price: "₦5,000",
                period: "per 15 days",
                description:
                  "Extend any job posting by 15 additional days beyond the standard 30-day window.",
                color: "text-purple-600",
                bg: "bg-purple-50",
                border: "border-purple-200",
              },
            ].map((addon) => (
              <div
                key={addon.title}
                className={`bg-white rounded-xl border-2 p-5 ${addon.border}`}
              >
                <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold mb-3 ${addon.bg} ${addon.color}`}>
                  Add-on
                </div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-bold text-gray-900">{addon.title}</h3>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">{addon.price}</p>
                    <p className="text-xs text-gray-400">{addon.period}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {addon.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-2 mb-8">
            <HelpCircle className="h-5 w-5 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq) => (
              <FAQItem
                key={faq.question}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gray-900 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to find your next great teacher?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Start for free today. No credit card required. Upgrade anytime
            when you are ready to hire at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/school">
              <Button className="bg-ink-600 hover:bg-ink-700 text-white px-8">
                Start for Free
              </Button>
            </Link>
            <Link href="/dashboard/school/subscription">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 px-8"
              >
                View Subscription Options
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}