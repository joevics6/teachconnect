"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Mail, MessageCircle, Phone, MapPin,
  CheckCircle2, Loader2, AlertCircle, Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const SUBJECTS = [
  "General Enquiry",
  "Teacher Account Help",
  "School Account Help",
  "Subscription & Billing",
  "Report a Bug",
  "Partnership",
  "Other",
]

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "", email: "", subject: "", message: "",
  })
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Please fill in all fields.")
      return
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Please enter a valid email address.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Submission failed")
      setSuccess(true)
      setForm({ name: "", email: "", subject: "", message: "" })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-white border-b border-gray-200 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Contact Us</h1>
          <p className="text-gray-500">
            Have a question, feedback, or need help with your account?
            We typically respond within 24 hours on business days.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Contact Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4">Get in Touch</h2>
            <div className="space-y-4">

              {/* WhatsApp */}
              <a
                href="https://wa.me/2347056928186"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-ink-50 transition group"
              >
                <div className="w-9 h-9 bg-ink-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-ink-200 transition">
                  <MessageCircle className="h-5 w-5 text-ink-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
                  <p className="text-xs text-gray-500">+234 705 692 8186</p>
                  <p className="text-xs text-ink-600 mt-0.5">Chat with us →</p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:TeachConnect@gmail.com"
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition group"
              >
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Email</p>
                  <p className="text-xs text-gray-500">TeachConnect@gmail.com</p>
                  <p className="text-xs text-blue-600 mt-0.5">Send us an email →</p>
                </div>
              </a>

              {/* Location */}
              <div className="flex items-start gap-3 p-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Location</p>
                  <p className="text-xs text-gray-500">Nigeria</p>
                </div>
              </div>
            </div>
          </div>

          {/* Response time notice */}
          <div className="bg-ink-50 border border-ink-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-ink-800 mb-1">Response time</p>
            <p className="text-xs text-ink-700">
              We respond to all enquiries within 24 hours on weekdays.
              For urgent issues, WhatsApp is fastest.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-5">Send a Message</h2>

            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-ink-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm mb-6">
                  We've received your message and will get back to you within 24 hours.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSuccess(false)}
                  className="text-sm"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink-500 bg-white"
                  >
                    <option value="">Select a subject...</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ink-500 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.message.length}/1000</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ink-600 hover:bg-ink-700 text-white py-3 font-semibold"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />Send Message</>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
