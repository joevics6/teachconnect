import type { Metadata } from "next"

// Teacher profiles are personal data — never offered to search engines.
export const metadata: Metadata = {
  title: "Teacher Profile",
  robots: { index: false, follow: false, nocache: true },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
