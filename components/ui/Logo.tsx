"use client"

import { useState } from "react"
import { GraduationCap } from "lucide-react"

// Reads from the public 'site-assets' bucket rather than a bundled
// /public file, so the logo can be swapped by uploading a new
// site-assets/logo.png in Supabase Storage — no redeploy needed.
// Falls back to the GraduationCap mark (the original placeholder) if
// no logo has been uploaded yet, or the image fails to load.
const LOGO_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/logo.png`
  : null

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  const [failed, setFailed] = useState(false)

  if (LOGO_URL && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small, rarely-changing brand asset; next/image adds no real benefit here
      <img
        src={LOGO_URL}
        alt="ClassHire"
        className={`${className} object-contain rounded-lg flex-shrink-0`}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div className={`bg-ink-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}>
      <GraduationCap className="w-[58%] h-[58%]" />
    </div>
  )
}
