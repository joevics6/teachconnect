"use client"

import { useState } from "react"
import Image from "next/image"
import brandLogo from "@/public/images/logo.png"
import brandLogoWhite from "@/public/images/logo-white.png"

// Reads from the public 'site-assets' bucket rather than a bundled
// /public file, so the logo can be swapped by uploading a new
// site-assets/logo.png in Supabase Storage — no redeploy needed.
// Falls back to the bundled brand mark if no override has been
// uploaded yet, or the remote image fails to load.
const LOGO_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-assets/logo.png`
  : null

interface LogoProps {
  className?: string
  /** Use "light" on dark backgrounds (e.g. the footer) to render a white mark. */
  variant?: "dark" | "light"
}

export function Logo({ className = "h-8 w-8", variant = "dark" }: LogoProps) {
  const [failed, setFailed] = useState(false)

  // The Supabase override is assumed to be a normal (dark-mark) logo;
  // once a school/admin can upload their own it may not suit a dark
  // background, but for our own light-variant footer usage we skip it
  // and always use the bundled white mark for legibility.
  if (LOGO_URL && !failed && variant === "dark") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote, rarely-changing brand asset; next/image adds no real benefit here
      <img
        src={LOGO_URL}
        alt="ClassHire"
        className={`${className} object-contain flex-shrink-0`}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <Image
      src={variant === "light" ? brandLogoWhite : brandLogo}
      alt="ClassHire"
      className={`${className} object-contain flex-shrink-0`}
    />
  )
}
