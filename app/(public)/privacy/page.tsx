import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Privacy Policy — TeachConnect" }

export default function PrivacyPage() {
  const updated = "1 July 2025"

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8 transition">
          <ArrowLeft className="h-4 w-4" />Back to home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: {updated}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Who We Are</h2>
            <p>TeachConnect is operated by JobMeter Nigeria. We run a teacher recruitment platform at <strong>teach.jobmeter.app</strong> that connects Nigerian schools with qualified teachers. Our contact email is <a href="mailto:hello@jobmeter.app" className="text-green-600 hover:underline">hello@jobmeter.app</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. What Information We Collect</h2>
            <p className="mb-3"><strong>Teachers:</strong> When you register, we collect your name, email address, phone number, location (state and LGA), teaching subjects, teaching levels, years of experience, TRCN registration status, CV content (uploaded or parsed), availability, salary expectations, and any profile photo you choose to upload.</p>
            <p><strong>Schools:</strong> When you register, we collect your school name, type, location, contact person details, email address, and payment information (processed by Paystack — we do not store card details).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To match teachers with relevant job vacancies</li>
              <li>To allow schools to search and contact qualified teachers</li>
              <li>To run subject knowledge quizzes and record results</li>
              <li>To send you relevant job alerts, notifications, and platform updates</li>
              <li>To process payments for school subscriptions</li>
              <li>To improve the platform and troubleshoot issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Who We Share Your Information With</h2>
            <p className="mb-3">We do not sell your personal data. We share limited information in the following cases:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Schools viewing your profile:</strong> If your profile is set to visible, schools on our platform can see your name, subjects, location, experience, TRCN status, and quiz results. Your phone number and email are only shared if you apply to their job or they have an active subscription that permits direct contact.</li>
              <li><strong>Service providers:</strong> We use Supabase (database and file storage) and Paystack (payment processing). Both operate under their own privacy and security standards.</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by Nigerian law or to protect the safety of users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Profile Visibility</h2>
            <p>As a teacher, you control whether your profile is visible to schools. You can toggle this at any time from your dashboard. When hidden, schools cannot find or view your profile, but your data remains stored in your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Data Storage and Security</h2>
            <p>Your data is stored securely on Supabase infrastructure. We use industry-standard encryption for data in transit (HTTPS). Profile photos are stored in Supabase object storage. We do not store payment card details — all payment processing is handled directly by Paystack.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate information on your profile</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent for us to display your profile to schools</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:hello@jobmeter.app" className="text-green-600 hover:underline">hello@jobmeter.app</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Cookies</h2>
            <p>We use essential cookies to maintain your login session. We do not use advertising or tracking cookies. No third-party analytics scripts are loaded on this platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p>We may update this policy from time to time. When we do, we will update the date at the top of this page. Continued use of the platform after changes constitutes acceptance of the revised policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">10. Contact</h2>
            <p>For any privacy-related questions, email <a href="mailto:hello@jobmeter.app" className="text-green-600 hover:underline">hello@jobmeter.app</a> or use our <Link href="/contact" className="text-green-600 hover:underline">contact form</Link>.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
