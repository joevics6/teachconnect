// ============================================================
// lib/index-notify.ts
// Tells search engines a job page exists/changed right when it goes
// live, instead of waiting for them to find it in the sitemap.
//
//  • Google Indexing API — the one Google documents for JobPosting
//    pages. Needs a service account added as an Owner of the site in
//    Search Console; credentials JSON in GOOGLE_INDEXING_CREDENTIALS.
//  • IndexNow — Bing, Yandex and others (not Google). Needs
//    INDEXNOW_KEY; the key file is served at /api/indexnow-key.
//
// Both are optional and silent: with no env vars set this does nothing,
// and every failure is swallowed — publishing a job never depends on it.
// ============================================================

import { createSign } from "crypto"
import { SITE_URL } from "@/lib/site"

interface ServiceAccount {
  client_email: string
  private_key: string
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")

async function googleAccessToken(sa: ServiceAccount): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  )
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(sa.private_key)
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${b64url(signature)}`,
    }),
  })
  if (!res.ok) return null
  return ((await res.json()) as { access_token?: string }).access_token ?? null
}

async function notifyGoogle(urls: string[], type: "URL_UPDATED" | "URL_DELETED") {
  const raw = process.env.GOOGLE_INDEXING_CREDENTIALS
  if (!raw) return
  const sa = JSON.parse(raw) as ServiceAccount
  const token = await googleAccessToken({ ...sa, private_key: sa.private_key.replace(/\\n/g, "\n") })
  if (!token) return
  for (const url of urls) {
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, type }),
    })
    if (!res.ok) console.error("Google Indexing API:", res.status, await res.text().catch(() => ""))
  }
}

async function notifyIndexNow(urls: string[]) {
  const key = process.env.INDEXNOW_KEY
  if (!key) return
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key,
      keyLocation: `${SITE_URL}/api/indexnow-key`,
      urlList: urls,
    }),
  })
  if (!res.ok) console.error("IndexNow:", res.status)
}

/** Call after a job goes live (and its search content exists). Never throws. */
export async function notifyJobsPublished(jobIds: string[]) {
  if (jobIds.length === 0) return
  const urls = jobIds.map((id) => `${SITE_URL}/jobs/${id}`)
  await Promise.allSettled([
    notifyGoogle(urls, "URL_UPDATED").catch((e) => console.error("Google index notify failed:", e)),
    notifyIndexNow(urls).catch((e) => console.error("IndexNow notify failed:", e)),
  ])
}

/** Call after a job is closed/removed so Google drops the listing. Never throws. */
export async function notifyJobsRemoved(jobIds: string[]) {
  if (jobIds.length === 0) return
  await notifyGoogle(jobIds.map((id) => `${SITE_URL}/jobs/${id}`), "URL_DELETED").catch((e) =>
    console.error("Google index removal notify failed:", e)
  )
}
