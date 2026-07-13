"use client"

import { XCircle } from "lucide-react"
import { LogoutButton } from "@/components/layout/LogoutButton"

export default function AccountDisabledPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Account disabled</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your account has been disabled. If you believe this is a mistake, please contact support.
        </p>
        <LogoutButton
          label="Log Out"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition"
        />
      </div>
    </div>
  )
}
