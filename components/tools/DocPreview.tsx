"use client"

import { useState } from "react"
import { Check, Copy, Download, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { docToText, type Block, type ToolDoc } from "@/lib/tools/doc"
import { downloadPdf, downloadWord } from "@/lib/tools/pdf"

/** Download / copy buttons shared by every tool. */
export function DocActions({ doc }: { doc: ToolDoc }) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const pdf = async () => {
    setBusy(true)
    try {
      await downloadPdf(doc)
    } catch (err) {
      console.error("PDF download failed:", err)
      alert("Sorry, the PDF could not be created. Try the Word download instead.")
    } finally {
      setBusy(false)
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(docToText(doc))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert("Could not copy. Please select the text and copy it manually.")
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="lg" onClick={pdf} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Download />} Download PDF
      </Button>
      <Button size="lg" variant="outline" onClick={() => downloadWord(doc)}>
        <FileText /> Word (editable)
      </Button>
      <Button size="lg" variant="outline" onClick={copy}>
        {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy text"}
      </Button>
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "title":
      return (
        <div className="border-b-2 border-ink-700 pb-2">
          <h3 className="text-xl font-bold text-ink-700">{block.text}</h3>
          {block.subtitle && <p className="text-sm text-gray-500">{block.subtitle}</p>}
        </div>
      )
    case "heading":
      return <h4 className="pt-2 text-sm font-bold uppercase tracking-wide text-ink-700">{block.text}</h4>
    case "paragraph":
      return <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">{block.text}</p>
    case "fields":
      return (
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 text-sm sm:grid-cols-2">
          {block.rows.map(([k, v]) => (
            <div key={k} className="flex gap-2 bg-white px-3 py-2">
              <dt className="w-28 flex-shrink-0 font-semibold text-gray-600">{k}</dt>
              <dd className="min-w-0 break-words text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>
      )
    case "list": {
      const Tag = block.ordered ? "ol" : "ul"
      return (
        <Tag className={`space-y-1 pl-5 text-sm text-gray-800 ${block.ordered ? "list-decimal" : "list-disc"}`}>
          {block.items.map((it, i) => (
            <li key={i} className="whitespace-pre-line">{it}</li>
          ))}
        </Tag>
      )
    }
    case "table":
      return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-ink-700 text-white">
              <tr>{block.head.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-gray-200 align-top">
                  {row.map((cell, j) => <td key={j} className="whitespace-pre-line px-3 py-2 text-gray-800">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

export function DocPreview({ doc }: { doc: ToolDoc }) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      {doc.blocks.map((b, i) => <BlockView key={i} block={b} />)}
    </div>
  )
}
