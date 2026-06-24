"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  Settings,
  Star,
  Users,
  X,
  Zap,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Types ───────────────────────────────────────────────────

interface Subscription {
  id: string
  plan_type: "free" | "standard" | "term"
  amount_paid: number
  starts_at: string
  expires_at: string | null
  is_active: boolean
  paystack_reference: string
}

interface UsageStat {
  label: string
  used: number
  limit: number | null
}

// ─── Constants ───────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard/school", label: "Overview", icon: Building2 },
  { href: "/dashboard/school/jobs", label: "My Jobs", icon: Briefcase },
  { href: "/dashboard/school/jobs/applicants", label: "Applicants", icon: Users },
  { href: "/talent", label: "Browse Teachers", icon: GraduationCap },
  { href: "/dashboard/school/subscription", label: "Subscription", icon: CreditCard },
  { href: "/schools/me", label: "School Profile", icon: Building2 },
  { href: "/dashboard/school/settings", label: "Settings", icon: Settings },
]

const PLANS = [
  {
    id: "standard",
    name: "Standard",
    price: 15000,
    period: "per posting",
    description: "Single job posting with full quiz screening",
    icon: Star,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-300",
    button: "bg-blue-700 hover:bg-blue-800",
    features: [
      "1 job posting (30 days)",
      "All 3 quiz modes",
      "Full applicant pipeline",
      "Download CVs",
      "Private posting",
    ],
  },
  {
    id: "term",
    name: "Term Plan",
    price: 75000,
    period: "per term",
    description: "Unlimited postings for a full school term",
    icon: Zap,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-400",
    button: "bg-green-600 hover:bg-green-700",
    badge: "Best Value",
    features: [
      "Unlimited postings",
      "All Standard features",
      "Full talent page",
      "Direct messaging",
      "1 featured listing",
      "Priority support",
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function getDaysRemaining(expiresAt: string) {
  return Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
}

function getPlanLabel(planType: string) {
  const map: Record<string, string> = {
    free: "Free Plan",
    standard: "Standard",
    term: "Term Plan",
  }
  return map[planType] || planType
}

// ─── Current Plan Card ────────────────────────────────────────

function CurrentPlanCard({
  subscription,
  usage,
}: {
  subscription: Subscription | null
  usage: UsageStat[]
}) {
  const planType = subscription?.plan_type || "free"
  const isActive = subscription?.is_active

  const daysLeft = subscription?.expires_at
    ? getDaysRemaining(subscription.expires_at)
    : null

  const planColors: Record<string, string> = {
    free: "from-gray-700 to-gray-800",
    standard: "from-blue-700 to-blue-800",
    term: "from-green-600 to-green-700",
  }

  return (
    <div
      className={`bg-gradient-to-r ${planColors[planType]} rounded-2xl p-6 text-white mb-6`}
    >
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-white/70">Current Plan</p>
            {isActive && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                Active
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold">{getPlanLabel(planType)}</h2>
        </div>

        {daysLeft !== null && (
          <div className="text-right">
            <p className="text-xs text-white/70">Expires in</p>
            <p
              className={`text-2xl font-bold ${
                daysLeft <= 7 ? "text-red-300" : "text-white"
              }`}
            >
              {daysLeft} days
            </p>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {usage.map((stat) => (
          <div
            key={stat.label}
            className="bg-white/10 rounded-xl p-3 text-center"
          >
            <p className="text-xl font-bold">
              {stat.used}
              {stat.limit !== null && (
                <span className="text-sm font-normal text-white/60">
                  /{stat.limit === -1 ? "∞" : stat.limit}
                </span>
              )}
            </p>
            <p className="text-xs text-white/70 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Expiry warning */}
      {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
        <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-red-500/20 border border-red-300/30 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4 text-red-300 flex-shrink-0" />
          <span className="text-red-100">
            Your plan expires in {daysLeft} days. Renew now to avoid interruption.
          </span>
        </div>
      )}

      {/* Subscription dates */}
      {subscription && (
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Started: {formatDate(subscription.starts_at)}
          </span>
          {subscription.expires_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Expires: {formatDate(subscription.expires_at)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Plan Purchase Card ───────────────────────────────────────

function PlanPurchaseCard({
  plan,
  isCurrentPlan,
  onPurchase,
  isPurchasing,
}: {
  plan: typeof PLANS[0]
  isCurrentPlan: boolean
  onPurchase: (planId: string) => void
  isPurchasing: string | null
}) {
  const Icon = plan.icon
  return (
    <div
      className={`relative bg-white rounded-2xl border-2 p-5 ${plan.border}`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-green-600 text-white text-xs font-bold rounded-full">
          {plan.badge}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${plan.bg}`}>
          <Icon className={`h-5 w-5 ${plan.color}`} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{plan.name}</h3>
          <p className="text-xs text-gray-500">{plan.description}</p>
        </div>
      </div>

      <div className="mb-4">
        <span className="text-3xl font-black text-gray-900">
          ₦{plan.price.toLocaleString()}
        </span>
        <span className="text-sm text-gray-400 ml-1">{plan.period}</span>
      </div>

      <div className="space-y-2 mb-5">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-xs text-gray-600">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            {feature}
          </div>
        ))}
      </div>

      {isCurrentPlan ? (
        <div className="w-full py-2 rounded-xl border-2 border-gray-200 text-center text-sm font-semibold text-gray-400">
          Current Plan
        </div>
      ) : (
        <Button
          onClick={() => onPurchase(plan.id)}
          disabled={isPurchasing !== null}
          className={`w-full text-white ${plan.button}`}
        >
          {isPurchasing === plan.id ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : plan.id === "standard" ? (
            "Buy Posting"
          ) : (
            "Subscribe Now"
          )}
        </Button>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

function SubscriptionPageInner() {
  const searchParams = useSearchParams()
  const preselectedPlan = searchParams.get("plan")

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageStat[]>([])
  const [history, setHistory] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState("")

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/school/subscription")
        const data = await response.json()
        setSubscription(data.subscription)
        setUsage(data.usage || [])
        setHistory(data.history || [])
      } catch (err) {
        console.error("Failed to fetch subscription:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSubscription()

    // Check for Paystack callback
    const reference = searchParams.get("reference")
    if (reference) {
      verifyPayment(reference)
    }
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch("/api/school/subscription/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })
      if (response.ok) {
        setPaymentSuccess(true)
        const data = await response.json()
        setSubscription(data.subscription)
      } else {
        setPaymentError("Payment verification failed. Contact support.")
      }
    } catch {
      setPaymentError("Could not verify payment. Contact support.")
    }
  }

  const handlePurchase = async (planId: string) => {
    setIsPurchasing(planId)
    setPaymentError("")
    try {
      const response = await fetch("/api/school/subscription/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to initiate payment")

      // Redirect to Paystack
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      }
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : "Payment initiation failed"
      )
    } finally {
      setIsPurchasing(null)
    }
  }

  const currentPlanType = subscription?.plan_type || "free"

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-auto`}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-green-600 text-white p-1.5 rounded-lg">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-xs text-gray-900">JobMeter</span>
              <span className="font-bold text-xs text-green-600">TeachConnect</span>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-blue-700" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                Greenfield Int&apos;l School
              </p>
              <p className="text-xs text-gray-500">Private • Lagos</p>
            </div>
          </div>
        </div>
        <nav className="p-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition mb-0.5"
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition w-full">
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <Link href="/dashboard/school" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Subscription</h1>
        </header>

        <div className="p-6 max-w-4xl mx-auto">

          {/* Payment Success */}
          {paymentSuccess && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Payment successful!</p>
                <p className="text-sm text-green-600">
                  Your plan has been activated. You can now post jobs and access
                  all features.
                </p>
              </div>
            </div>
          )}

          {/* Payment Error */}
          {paymentError && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{paymentError}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Current Plan */}
              <CurrentPlanCard subscription={subscription} usage={usage} />

              {/* Upgrade Plans */}
              <div className="mb-8">
                <h2 className="font-bold text-gray-900 mb-4">
                  {currentPlanType === "term"
                    ? "Renew Your Plan"
                    : "Upgrade Your Plan"}
                </h2>

                {paymentError && (
                  <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {paymentError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {PLANS.map((plan) => (
                    <PlanPurchaseCard
                      key={plan.id}
                      plan={plan}
                      isCurrentPlan={
                        currentPlanType === plan.id &&
                        subscription?.is_active === true
                      }
                      onPurchase={handlePurchase}
                      isPurchasing={isPurchasing}
                    />
                  ))}
                </div>

                <p className="text-xs text-gray-400 mt-4 text-center">
                  Payments processed securely via Paystack. All amounts in
                  Nigerian Naira (₦).
                </p>
              </div>

              {/* Payment History */}
              {history.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900">
                      Payment History
                    </h2>
                    <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-gray-100 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              item.plan_type === "term"
                                ? "bg-green-100"
                                : "bg-blue-100"
                            }`}
                          >
                            <CreditCard
                              className={`h-4 w-4 ${
                                item.plan_type === "term"
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {getPlanLabel(item.plan_type)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(item.starts_at)} •{" "}
                              {item.paystack_reference}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            ₦{item.amount_paid.toLocaleString()}
                          </p>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              item.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {item.is_active ? "Active" : "Expired"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Support */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Need help with your subscription?
                  </p>
                  <p className="text-xs text-gray-500">
                    Contact us and we will assist you within 24 hours.
                  </p>
                </div>
                <Link href="/contact">
                  <Button variant="outline" size="sm" className="text-xs">
                    Contact Support
                  </Button>
                </Link>
              </div>

              {/* Full pricing link */}
              <div className="mt-4 text-center">
                <Link
                  href="/pricing"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View full pricing and feature comparison →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <SubscriptionPageInner />
    </Suspense>
  )
}