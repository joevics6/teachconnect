"use client"

// ============================================================
// components/jobs/ExternalApplyPanel.tsx
// Displays the school's external contact(s) as actual visible text
// plus a clear action button per contact — NOT a plain "Apply Now"
// button that hides what clicking it does. A school can list more
// than one way to apply (email, WhatsApp, website — any mix), so this
// renders one row per contact rather than guessing a single type for
// the whole field. Used on both the public job detail page and the
// quiz results page.
// ============================================================

import { useState } from "react"
import { Mail, Phone, Globe, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getExternalApplyContacts, type ExternalApplyContact } from "@/lib/external-apply"

const TYPE_CONFIG = {
  email: { Icon: Mail, heading: "Email", actionLabel: "Send Email" },
  phone: { Icon: Phone, heading: "WhatsApp", actionLabel: "Message on WhatsApp" },
  url: { Icon: Globe, heading: "Website", actionLabel: "Open Website" },
} as const

function ContactRow({ contact }: { contact: ExternalApplyContact }) {
  const [copied, setCopied] = useState(false)
  const { Icon, heading, actionLabel } = TYPE_CONFIG[contact.type]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contact.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy")
    }
  }

  return (
    <div className="bg-white border border-orange-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-orange-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-gray-900">{heading}</span>
      </div>

      <div className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
        <span className="text-sm font-medium text-gray-900 break-all">{contact.value}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          title="Copy"
        >
          {copied ? <Check className="h-4 w-4 text-ink-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <a href={contact.href} target="_blank" rel="noopener noreferrer">
        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" size="sm">
          {actionLabel}
        </Button>
      </a>
    </div>
  )
}

export function ExternalApplyPanel({
  value,
  schoolName,
}: {
  value: string
  schoolName?: string
}) {
  const contacts = getExternalApplyContacts(value)
  if (contacts.length === 0) return null

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
      <h3 className="font-bold text-gray-900 mb-1">
        {contacts.length > 1 ? "Ways to Apply" : "Apply Directly"}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {schoolName ? `${schoolName} wants` : "This school wants"} applicants
        to reach out directly instead of using the built-in form.
        {contacts.length > 1 ? " Pick whichever works for you." : ""}
      </p>

      <div className="space-y-3">
        {contacts.map((contact) => (
          <ContactRow key={contact.value} contact={contact} />
        ))}
      </div>
    </div>
  )
}
