import Link from "next/link"
import { GraduationCap } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-green-600 text-white p-1.5 rounded-lg">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-base text-white">TeachConnect</span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              Nigeria&apos;s dedicated teacher recruitment platform. Connecting qualified teachers with schools nationwide.
            </p>
            <a href="mailto:hello@jobmeter.app" className="text-sm text-green-500 hover:text-green-400 transition">
              hello@jobmeter.app
            </a>
          </div>

          {/* Teachers */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">For Teachers</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/jobs"             className="hover:text-white transition">Browse Jobs</Link></li>
              <li><Link href="/register/teacher" className="hover:text-white transition">Create Profile</Link></li>
              <li><Link href="/resources"        className="hover:text-white transition">Career Resources</Link></li>
              <li><Link href="/contact"          className="hover:text-white transition">Get Help</Link></li>
            </ul>
          </div>

          {/* Schools */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">For Schools</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/talent"          className="hover:text-white transition">Browse Teachers</Link></li>
              <li><Link href="/register/school" className="hover:text-white transition">Post a Job</Link></li>
              <li><Link href="/pricing"         className="hover:text-white transition">Pricing</Link></li>
              <li><Link href="/contact"         className="hover:text-white transition">Contact Sales</Link></li>
            </ul>
          </div>

          {/* Legal & Company */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms"   className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
              <li>
                <a href="https://jobmeter.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  JobMeter Nigeria ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} TeachConnect. A JobMeter Nigeria product. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-white transition">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
