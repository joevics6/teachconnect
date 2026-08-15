import Image from "next/image"
import logo from "@/public/images/logo.png"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="relative flex items-center justify-center">
        <span className="absolute h-24 w-24 rounded-full border-4 border-ink-100" />
        <span className="absolute h-24 w-24 rounded-full border-4 border-ink-600 border-t-transparent animate-spin" />
        <div className="h-14 w-14 animate-pulse">
          <Image src={logo} alt="ClassHire" className="h-full w-full object-contain" priority />
        </div>
      </div>
      <p className="mt-6 text-sm font-medium text-gray-400 tracking-wide">Loading ClassHire…</p>
    </div>
  )
}
