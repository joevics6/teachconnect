"use client"

import { useState } from "react"
import Image from "next/image"
import brandLogo from "@/public/images/logo.png"

// Reads from the public 'site-assets' bucket rather than a bundled
// /public file, so the logo can be swapped by uploading a new
// site-assets/logo.png in Supabase Storage — no redeploy needed.
// Falls back to the bundled brand mark (public/images/logo.png) if
// no override has been uploaded yet, or the remote image fails to load.
const LOGO_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/logo.png`
  : null

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  const [failed, setFailed] = useState(false)

  if (LOGO_URL && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote, rarely-changing brand asset; next/image adds no real benefit here
      <img
        src={LOGO_URL}
        alt="ClassHire"
        className={`${className} object-contain rounded-lg flex-shrink-0`}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <Image
      src={brandLogo}
      alt="ClassHire"
      className={`${className} object-contain rounded-lg flex-shrink-0`}
    />
  )
}
