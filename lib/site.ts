// ============================================================
// lib/site.ts
// One place for site-wide SEO constants, so the domain, brand name
// and default share image aren't hardcoded across pages.
// ============================================================

export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://classhire.jobmeter.app").replace(/\/$/, "")
export const SITE_NAME = "ClassHire"

// File-based metadata images (app/opengraph-image.png) are served here.
export const OG_IMAGE_URL = `${SITE_URL}/opengraph-image.png`
export const LOGO_URL = `${SITE_URL}/images/logo.png`

export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`

/** Serialises JSON-LD safely for use inside a <script> tag. */
export const toJsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c")

export const trimText = (s: string, max: number) =>
  s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`

/** Collapses whitespace so excerpts read cleanly in meta descriptions. */
export const oneLine = (s: string) => s.replace(/\s+/g, " ").trim()

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
}
