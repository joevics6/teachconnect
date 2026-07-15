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

export const metadata: Metadata = {
  title: "ClassHire — Nigeria's Teacher Recruitment Platform",
  description:
    "Find teaching jobs across Nigeria or hire pre-screened, qualified teachers for your school. Nigeria's only dedicated teacher recruitment platform.",
  keywords:
    "teacher jobs nigeria, school recruitment, teaching jobs lagos, hire teachers nigeria, classhire",
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