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
              <div className="flex flex-col leading-none">
                <span className="font-bold text-sm text-white">
                  JobMeter
                </span>
                <span className="font-bold text-sm text-green-500">
                  TeachConnect
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed">
              Nigeria's dedicated teacher recruitment platform.
              Connecting quality teachers with schools nationwide.
            </p>
          </div>

          {/* Teachers */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">
              For Teachers
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/jobs" className="hover:text-white transition">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link
                  href="/register/teacher"
                  className="hover:text-white transition"
                >
                  Create Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="hover:text-white transition"
                >
                  Career Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Schools */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">
              For Schools
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/talent"
                  className="hover:text-white transition"
                >
                  Browse Teachers
                </Link>
              </li>
              <li>
                <Link
                  href="/register/school"
                  className="hover:text-white transition"
                >
                  Post a Job
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-white transition"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="https://jobmeter.app"
                  className="hover:text-white transition"
                >
                  JobMeter Nigeria
                </Link>
              </li>
              <li>
                <Link
                  href="https://gulf.jobmeter.app"
                  className="hover:text-white transition"
                >
                  JobMeter Gulf
                </Link>
              </li>
              <li>
                <Link
                  href="https://global.jobmeter.app"
                  className="hover:text-white transition"
                >
                  JobMeter Global
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>
            © {new Date().getFullYear()} JobMeter TeachConnect.
            All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/contact" className="hover:text-white transition">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}