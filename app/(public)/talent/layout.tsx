import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Teachers in Nigeria – Hire Qualified Teachers",
  description:
    "Search verified teacher profiles across Nigeria by subject, level, location and experience, and hire qualified teachers for your school directly.",
  alternates: { canonical: "/talent" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
