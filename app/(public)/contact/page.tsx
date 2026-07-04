"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, MessageSquare, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")
    if (!form.name || !form.email || !form.message) {
      setError("Please fill in all required fields.")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to send")
      setSent(true)
    } catch {
      setError("Something went wrong. Please email us directly at hello@jobmeter.app")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8 transition">
          <ArrowLeft className="h-4 w-4" />Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-500 mb-10">Have a question, problem, or feedback? We read every message.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
            <div className="bg-green-50 p-2.5 rounded-lg flex-shrink-0">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-0.5">Email</p>
              <a href="mailto:hello@jobmeter.app" className="text-sm text-green-600 hover:underline">
                hello@jobmeter.app
              </a>
              <p className="text-xs text-gray-400 mt-1">We reply within 1 business day</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-3">
            <div className="bg-blue-50 p-2.5 rounded-lg flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-0.5">WhatsApp</p>
              <a href="https://wa.me/2348000000000" className="text-sm text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                +234 800 000 0000
              </a>
              <p className="text-xs text-gray-400 mt-1">Mon – Fri, 9am – 5pm WAT</p>
            </div>
          </div>
        </div>

        {sent ? (
          <div className="bg-white rounded-xl border border-green-200 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Message sent!</h2>
            <p className="text-gray-500 text-sm">Thanks for reaching out. We'll get back to you at <strong>{form.email}</strong> within one business day.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Send a Message</h2>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Select a topic…</option>
                <option value="teacher-account">Teacher account issue</option>
                <option value="school-account">School account issue</option>
                <option value="subscription">Subscription / billing</option>
                <option value="job-listing">Job listing problem</option>
                <option value="bug">Bug report</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Message *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Describe your issue or question in as much detail as possible…"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={sending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {sending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</> : "Send Message"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
