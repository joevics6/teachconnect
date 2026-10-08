import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing for Schools – Post Teaching Jobs in Nigeria",
  description:
    "Simple plans for Nigerian schools to post teaching vacancies, feature jobs and hire verified teachers directly. Compare what each plan includes.",
  alternates: { canonical: "/pricing" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
