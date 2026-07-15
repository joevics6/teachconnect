"use client"

import { useState } from "react"
import { Download, ExternalLink, Share2, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  slug:         string
  title:        string
  resourceType: string
  fileUrl:      string | null
  externalUrl:  string | null
  downloadCount: number
  hasAccess:    boolean
}

export default function ResourceAccessPanel({
  slug, title, resourceType, fileUrl, externalUrl, downloadCount, hasAccess,
}: Props) {
  const [accessing, setAccessing] = useState(false)
  const [accessed,  setAccessed]  = useState(false)
  const [copied,    setCopied]    = useState(false)

  const isFile = resourceType === "pdf" || resourceType === "document"

  const handleAccess = async () => {
    if (!hasAccess) return
    setAccessing(true)
    try {
      // Fire-and-forget count increment
      fetch(`/api/resources/posts/${slug}/access`, { method: "POST" }).catch(() => {})
      const url = fileUrl || externalUrl
      if (url) {
        window.open(url, "_blank")
        setAccessed(true)
      }
    } finally {
      setAccessing(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch { /* ignore cancelled share */ }
  }

  if (!hasAccess) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <Button variant="outline" onClick={handleShare} className="w-full text-sm">
          {copied
            ? <><CheckCircle2 className="h-4 w-4 mr-2 text-ink-600" />Link Copied!</>
            : <><Share2 className="h-4 w-4 mr-2" />Share this article</>}
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
      <h3 className="font-bold text-gray-900 mb-1 text-sm">
        {isFile ? "Download" : "Access"} this resource
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Free {isFile ? "to download" : "to access"} — no sign-up required
      </p>

      <Button
        onClick={handleAccess}
        disabled={accessing}
        className="w-full bg-ink-600 hover:bg-ink-700 text-white mb-3"
      >
        {accessing ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Opening…</>
        ) : accessed ? (
          <><CheckCircle2 className="h-4 w-4 mr-2" />Opened!</>
        ) : isFile ? (
          <><Download className="h-4 w-4 mr-2" />Download Free</>
        ) : (
          <><ExternalLink className="h-4 w-4 mr-2" />Access Resource</>
        )}
      </Button>

      <Button variant="outline" onClick={handleShare} className="w-full text-sm mb-3">
        {copied
          ? <><CheckCircle2 className="h-4 w-4 mr-2 text-ink-600" />Link Copied!</>
          : <><Share2 className="h-4 w-4 mr-2" />Share</>}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        {downloadCount.toLocaleString()} {isFile ? "downloads" : "views"}
      </p>
    </div>
  )
}
