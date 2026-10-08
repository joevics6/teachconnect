import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Questions about teaching jobs, hiring teachers or your ClassHire account? Send us a message — we typically reply within 24 hours on business days.",
  alternates: { canonical: "/contact" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
