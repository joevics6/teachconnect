import type { Metadata } from "next"
import { getSchoolsDirectoryFirstPage } from "@/lib/cache/schools"
import { absoluteUrl, SITE_NAME, toJsonLdString } from "@/lib/site"
import SchoolsClient, { type DirectorySchool } from "./SchoolsClient"

export const revalidate = 300

const TITLE = "Schools Hiring Teachers in Nigeria – School Directory"
const DESCRIPTION =
  "Browse private, public, international and missionary schools hiring teachers across Nigeria. See school profiles, locations and open teaching jobs."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/schools" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/schools"), siteName: SITE_NAME, type: "website" },
}

export default async function SchoolsPage() {
  let initial: { schools: DirectorySchool[]; total: number } | undefined
  try {
    const r = await getSchoolsDirectoryFirstPage()
    // An empty result may just mean the anon role can't read the table;
    // let the client fetch (as before) rather than show an empty directory.
    if (r.total > 0) initial = { schools: r.schools as DirectorySchool[], total: r.total }
  } catch (err) {
    // Fall back to the client-side fetch rather than failing the page.
    console.error("Schools page: server fetch failed:", err)
  }

  const listed = (initial?.schools ?? []).filter((s) => s.slug)
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: listed.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/schools/${s.slug}`),
      name: s.school_name,
    })),
  }

  return (
    <>
      {listed.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(listLd) }} />
      )}
      <SchoolsClient initial={initial} />
    </>
  )
}
