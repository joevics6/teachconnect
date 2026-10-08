import Link from "next/link"
import { ChevronRight } from "lucide-react"

export interface Crumb {
  name: string
  href?: string // omit for the current page
}

/** Visible breadcrumb trail. The matching JSON-LD is built by each page. */
export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-sm text-gray-500 ${className}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex items-center gap-1.5 min-w-0">
            {item.href ? (
              <Link href={item.href} className="hover:text-gray-800 hover:underline">{item.name}</Link>
            ) : (
              <span aria-current="page" className="text-gray-700 truncate max-w-[16rem] sm:max-w-md">{item.name}</span>
            )}
            {i < items.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />}
          </li>
        ))}
      </ol>
    </nav>
  )
}
