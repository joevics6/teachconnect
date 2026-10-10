// ============================================================
// components/ui/Markdown.tsx
// Renders Markdown as real headings/lists/links (server-side, no raw
// HTML) with stable ids on h2/h3 so a table of contents can link to
// them. Single newlines are kept as line breaks so older plain-text
// posts still read the way they were written.
// ============================================================

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import type { ReactNode } from "react"

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

/** Extracts h2/h3 headings from Markdown source for a table of contents. */
export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = []
  const used = new Map<string, number>()
  let inFence = false
  for (const line of markdown.split("\n")) {
    if (line.trim().startsWith("```")) inFence = !inFence
    if (inFence) continue
    const m = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line)
    if (!m) continue
    const text = m[2].replace(/[*_`[\]]/g, "")
    let id = slugifyHeading(text) || "section"
    const n = used.get(id) ?? 0
    used.set(id, n + 1)
    if (n > 0) id = `${id}-${n + 1}`
    items.push({ id, text, level: m[1].length === 2 ? 2 : 3 })
  }
  return items
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (node && typeof node === "object" && "props" in node) return textOf((node as { props: { children?: ReactNode } }).props.children)
  return ""
}

export function Markdown({ children, className = "" }: { children: string; className?: string }) {
  const used = new Map<string, number>()
  const headingId = (children: ReactNode) => {
    const id = slugifyHeading(textOf(children)) || "section"
    const n = used.get(id) ?? 0
    used.set(id, n + 1)
    return n > 0 ? `${id}-${n + 1}` : id
  }

  return (
    <div
      className={`prose prose-sm sm:prose-base max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:scroll-mt-24 prose-a:text-ink-600 prose-a:no-underline hover:prose-a:underline ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
          h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
          a: ({ href, children }) => {
            const external = !!href && /^https?:\/\//.test(href)
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            )
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

export function TableOfContents({ items }: { items: TocItem[] }) {
  if (items.filter((i) => i.level === 2).length < 3) return null
  return (
    <nav aria-label="Table of contents" className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
      <p className="font-bold text-gray-900 text-sm mb-2">In this article</p>
      <ol className="space-y-1.5 text-sm">
        {items.map((i) => (
          <li key={i.id} className={i.level === 3 ? "ml-4" : ""}>
            <a href={`#${i.id}`} className="text-ink-600 hover:underline">{i.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
