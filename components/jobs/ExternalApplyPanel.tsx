"use client"

// ============================================================
// components/jobs/ExternalApplyPanel.tsx
// Displays the school's external contact (email/phone/website) as
// actual visible text plus an action link — NOT a plain "Apply Now"
// button that hides what clicking it does. Used on both the public
// job detail page and the quiz results page (same underlying case:
// external_apply_enabled + a revealed external_apply_value).
// ============================================================

import { useState } from "react"
import { Mail, Phone, Globe, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { detectExternalApplyType, getExternalApplyHref } from "@/lib/external-apply"

const TYPE_CONFIG = {
  email: { Icon: Mail, heading: "Apply via Email", actionLabel: "Send Email" },
  phone: { Icon: Phone, heading: "Apply via WhatsApp", actionLabel: "Message on WhatsApp" },
  url: { Icon: Globe, heading: "Apply on Website", actionLabel: "Open Website" },
} as const

export function ExternalApplyPanel({
  value,
  schoolName,
}: {
  value: string
  schoolName?: string
}) {
  const [copied, setCopied] = useState(false)
  const type = detectExternalApplyType(value)
  const { Icon, heading, actionLabel } = TYPE_CONFIG[type]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error("Failed to copy")
    }
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-5 w-5 text-orange-600 flex-shrink-0" />
        <h3 className="font-bold text-gray-900">{heading}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        {schoolName ? `${schoolName} wants` : "This school wants"} applicants
        to reach out directly instead of using the built-in form.
      </p>

      <div className="flex items-center justify-between gap-2 bg-white border border-orange-200 rounded-xl px-4 py-3 mb-3">
        <span className="text-sm font-medium text-gray-900 break-all">{value}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          title="Copy"
        >
          {copied ? <Check className="h-4 w-4 text-ink-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <a href={getExternalApplyHref(value)} target="_blank" rel="noopener noreferrer">
        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
          {actionLabel}
        </Button>
      </a>
    </div>
  )
}
