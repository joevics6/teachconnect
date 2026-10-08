import type { Metadata } from "next"
import { Inter, Fraunces } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { AuthProvider } from "@/lib/auth-context"
import { organizationJsonLd, SITE_NAME, SITE_URL, toJsonLdString } from "@/lib/site"

const inter = Inter({ subsets: ["latin"] })
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
  style: ["normal", "italic"],
})

const title = "ClassHire – Teaching Jobs in Nigeria & Teacher Recruitment"
const description =
  "Find teaching jobs in Nigeria or hire pre-screened, qualified teachers for your school. Direct hiring across Lagos, Abuja, Port Harcourt and more — no agencies."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Pages set a short title; the template adds the brand once.
  title: { default: title, template: `%s | ${SITE_NAME}` },
  description,
  applicationName: SITE_NAME,
  openGraph: {
    title,
    description,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
}

const siteJsonLd = [
  organizationJsonLd,
  { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL, inLanguage: "en-NG" },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-NG">
      <body className={`${inter.className} ${fraunces.variable} min-h-screen flex flex-col`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdString(siteJsonLd) }} />
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}