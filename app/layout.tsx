import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JobMeter TeachConnect — Nigeria's Teacher Recruitment Platform",
  description:
    "Find teaching jobs across Nigeria or hire pre-screened, qualified teachers for your school. Nigeria's only dedicated teacher recruitment platform.",
  keywords:
    "teacher jobs nigeria, school recruitment, teaching jobs lagos, hire teachers nigeria",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}