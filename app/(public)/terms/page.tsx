import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Terms of Service — TeachConnect" }

export default function TermsPage() {
  const updated = "1 July 2025"

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8 transition">
          <ArrowLeft className="h-4 w-4" />Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {updated}</p>

        <div className="space-y-8 text-gray-600 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using TeachConnect (operated by JobMeter Nigeria at teach.jobmeter.app), you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Who Can Use TeachConnect</h2>
            <p className="mb-3">TeachConnect is available to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Teachers:</strong> Individuals qualified to teach in Nigerian schools, whether registered with TRCN or in the process of registering.</li>
              <li><strong>Schools:</strong> Registered Nigerian educational institutions looking to hire qualified teaching staff.</li>
            </ul>
            <p className="mt-3">You must be at least 18 years old to create an account. By registering, you confirm that the information you provide is accurate and complete.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Teacher Accounts</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for the accuracy of your profile, including your qualifications, TRCN status, and experience claims.</li>
              <li>Misrepresenting your qualifications or providing false information is grounds for immediate account termination.</li>
              <li>You control whether your profile is visible to schools. When visible, schools can find and view your profile.</li>
              <li>Quiz results are recorded and shared with schools when you apply to their vacancies.</li>
              <li>You may delete your account at any time by contacting us at hello@jobmeter.app.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. School Accounts</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Schools must represent a genuine educational institution. We reserve the right to verify school details.</li>
              <li>Job postings must be for real, active vacancies. Fake or misleading job listings are prohibited.</li>
              <li>Schools are responsible for conducting their own due diligence before hiring any teacher through the platform.</li>
              <li>Contact details of teachers (phone, email) may only be used for the purpose of the relevant job application.</li>
              <li>Subscription fees are non-refundable except where required by law or at our discretion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Prohibited Conduct</h2>
            <p className="mb-3">You must not:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Create fake profiles or impersonate another person or institution</li>
              <li>Use teacher contact details for purposes unrelated to hiring</li>
              <li>Scrape, harvest, or systematically copy data from the platform</li>
              <li>Attempt to bypass subscription limits or platform access controls</li>
              <li>Post discriminatory job listings or engage in harassment of any user</li>
              <li>Use the platform to advertise products, services, or opportunities unrelated to teaching employment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Payments and Subscriptions</h2>
            <p className="mb-3">School subscriptions are processed by Paystack. By subscribing, you authorise us to charge the applicable fee for your chosen plan. Subscriptions cover a fixed term (per term or per year depending on the plan chosen).</p>
            <p>We do not store your payment card details. Refund requests are reviewed case by case — contact us at hello@jobmeter.app.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
            <p>TeachConnect and its content (design, code, copy, quiz questions) are owned by JobMeter Nigeria. You may not reproduce, distribute, or create derivative works without written permission. Your profile content remains yours — you grant us a licence to display it on the platform while your account is active.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p>TeachConnect is a platform that connects teachers and schools. We do not guarantee employment outcomes, interview invitations, or hiring decisions. We are not liable for any disputes arising between teachers and schools, including salary disagreements, contract terms, or employment conditions. Use of the platform is at your own risk.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Account Termination</h2>
            <p>We reserve the right to suspend or terminate any account that violates these terms, provides false information, or engages in conduct harmful to other users or the platform. You may request account deletion at any time by emailing hello@jobmeter.app.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Governing Law</h2>
            <p>These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes will be subject to the jurisdiction of Nigerian courts.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">11. Changes to These Terms</h2>
            <p>We may update these terms from time to time. We will notify registered users of material changes by email or in-app notification. Continued use of the platform after changes take effect constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">12. Contact</h2>
            <p>Questions about these terms? Email <a href="mailto:hello@jobmeter.app" className="text-green-600 hover:underline">hello@jobmeter.app</a> or use our <Link href="/contact" className="text-green-600 hover:underline">contact form</Link>.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
