import type { Metadata } from "next"
import { Inter, Fraunces } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { AuthProvider } from "@/lib/auth-context"

const inter = Inter({ subsets: ["latin"] })
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
  style: ["normal", "italic"],
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://classhire.jobmeter.app"
const title = "ClassHire — Nigeria's Teacher Recruitment Platform"
const description =
  "Find teaching jobs across Nigeria or hire pre-screened, qualified teachers for your school. Nigeria's only dedicated teacher recruitment platform."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords:
    "teacher jobs nigeria, school recruitment, teaching jobs lagos, hire teachers nigeria, classhire",
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "ClassHire",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${fraunces.variable} min-h-screen flex flex-col`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}