import type { Metadata } from "next"
import HomeClient from "./HomeClient"
import HomeBrowse from "@/components/home/HomeBrowse"

export const metadata: Metadata = {
  // Absolute so the home page title isn't run through the "%s | ClassHire" template.
  title: { absolute: "ClassHire – Teaching Jobs in Nigeria & Teacher Recruitment" },
  alternates: { canonical: "/" },
}

export default function HomePage() {
  return (
    <>
      <HomeClient />
      <HomeBrowse />
    </>
  )
}
