"use client"

import { useState } from "react"
import Link from "next/link"
import { GraduationCap, Loader2, ArrowLeft, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Request failed")
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="bg-green-600 text-white p-2 rounded-xl">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex flex-col leading-none text-left">
              <span className="font-bold text-gray-900">JobMeter</span>
              <span className="font-bold text-green-600">TeachConnect</span>
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

          {/* Success State */}
          {submitted ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-5">
                <MailCheck className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                We sent a password reset link to{" "}
                <span className="font-medium text-gray-700">{email}</span>.
                Check your inbox and follow the instructions.
              </p>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Forgot your password?
                </h1>
                <p className="text-gray-500 text-sm">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <Link href="/login">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-gray-500"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}