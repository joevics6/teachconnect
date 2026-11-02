// ============================================================
// lib/tools/pdf.ts
// Turns a ToolDoc into a downloaded PDF, Word file or clipboard text. jsPDF
// is imported on click so it never weighs on the page load. jsPDF's built-in
// fonts only cover Western characters, so anything else (the naira sign,
// arrows, subscripts) is swapped for a plain equivalent in the PDF only.
// ============================================================

import type { ToolDoc } from "./doc"
import { docToHtml } from "./doc"

const PDF_REPLACEMENTS: [RegExp, string | ((match: string) => string)][] = [
  [/₦/g, "N"],
  [/[→⟶]/g, "->"],
  [/[←]/g, "<-"],
  [/≥/g, ">="],
  [/≤/g, "<="],
  [/≠/g, "!="],
  [/≈/g, "~"],
  [/√/g, "sqrt "],
  [/π/g, "pi"],
  [/[₀-₉]/g, (m: string) => String(m.charCodeAt(0) - 0x2080)],
  [/[“”]/g, '"'],
  [/[‘’]/g, "'"],
  [/[\u2022\u25CF]/g, "-"],
]

function pdfSafe(text: string): string {
  let t = text
  for (const [re, rep] of PDF_REPLACEMENTS) t = t.replace(re, rep as string)
  // Anything still outside Latin-1 would print as garbage; drop it.
  return t.replace(/[^\u0009\u000A\u0020-\u007E\u00A0-\u00FF–—…]/g, "")
}

const INK: [number, number, number] = [40, 58, 87]
const GREY: [number, number, number] = [90, 90, 90]
const MARGIN = 15

export async function downloadPdf(doc: ToolDoc) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const autoTable = autoTableModule.default
  const pdf = new jsPDF({ unit: "mm", format: "a4" })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const width = pageW - MARGIN * 2
  let y = MARGIN

  const space = (needed: number) => {
    if (y + needed > pageH - 18) {
      pdf.addPage()
      y = MARGIN
    }
  }
  const afterTable = () => {
    const last = (pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
    y = (last?.finalY ?? y) + 5
  }
  const writeLines = (lines: string[], lineH: number) => {
    for (const line of lines) {
      space(lineH)
      pdf.text(line, MARGIN, y)
      y += lineH
    }
  }

  for (const b of doc.blocks) {
    switch (b.type) {
      case "title": {
        pdf.setFont("helvetica", "bold").setFontSize(18).setTextColor(...INK)
        writeLines(pdf.splitTextToSize(pdfSafe(b.text), width), 8)
        if (b.subtitle) {
          pdf.setFont("helvetica", "normal").setFontSize(10).setTextColor(...GREY)
          writeLines(pdf.splitTextToSize(pdfSafe(b.subtitle), width), 5)
        }
        pdf.setDrawColor(...INK).setLineWidth(0.5).line(MARGIN, y, pageW - MARGIN, y)
        y += 6
        break
      }
      case "heading": {
        space(14)
        y += 2
        pdf.setFont("helvetica", "bold").setFontSize(11.5).setTextColor(...INK)
        writeLines([pdfSafe(b.text).toUpperCase()], 6)
        break
      }
      case "paragraph": {
        pdf.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 30, 30)
        writeLines(pdf.splitTextToSize(pdfSafe(b.text), width), 5)
        y += 2
        break
      }
      case "list": {
        pdf.setFont("helvetica", "normal").setFontSize(10).setTextColor(30, 30, 30)
        b.items.forEach((item, i) => {
          const marker = b.ordered ? `${i + 1}.` : "-"
          const lines: string[] = pdf.splitTextToSize(pdfSafe(item), width - 8)
          lines.forEach((line, li) => {
            space(5)
            if (li === 0) pdf.text(marker, MARGIN + 1, y)
            pdf.text(line, MARGIN + 8, y)
            y += 5
          })
        })
        y += 2
        break
      }
      case "fields": {
        const body: string[][] = []
        for (let i = 0; i < b.rows.length; i += 2) {
          const [k1, v1] = b.rows[i]
          const [k2, v2] = b.rows[i + 1] ?? ["", ""]
          body.push([pdfSafe(k1), pdfSafe(v1), pdfSafe(k2), pdfSafe(v2)])
        }
        autoTable(pdf, {
          startY: y,
          body,
          theme: "grid",
          styles: { fontSize: 9, cellPadding: 2, lineColor: [200, 208, 222] },
          columnStyles: {
            0: { fontStyle: "bold", fillColor: [243, 245, 249], cellWidth: 30 },
            1: { cellWidth: "auto" },
            2: { fontStyle: "bold", fillColor: [243, 245, 249], cellWidth: 30 },
            3: { cellWidth: "auto" },
          },
          margin: { left: MARGIN, right: MARGIN },
        })
        afterTable()
        break
      }
      case "table": {
        autoTable(pdf, {
          startY: y,
          head: [b.head.map(pdfSafe)],
          body: b.rows.map((r) => r.map(pdfSafe)),
          theme: "grid",
          headStyles: { fillColor: INK, textColor: 255, fontSize: 9 },
          styles: { fontSize: 8.5, cellPadding: 2, lineColor: [200, 208, 222], valign: "top" },
          columnStyles: b.widths
            ? Object.fromEntries(b.widths.map((w, i) => [i, { cellWidth: (width * w) / 100 }]))
            : undefined,
          margin: { left: MARGIN, right: MARGIN },
        })
        afterTable()
        break
      }
    }
  }

  const pages = pdf.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p)
    pdf.setFont("helvetica", "normal").setFontSize(8).setTextColor(130, 130, 130)
    pdf.text("Generated free on ClassHire - classhire.com.ng/tools", MARGIN, pageH - 8)
    pdf.text(`Page ${p} of ${pages}`, pageW - MARGIN, pageH - 8, { align: "right" })
  }
  pdf.save(`${doc.filename}.pdf`)
}

/** Editable Word file (HTML that Word and Google Docs open as a document). */
export function downloadWord(doc: ToolDoc) {
  const blob = new Blob(["\ufeff", docToHtml(doc)], { type: "application/msword" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${doc.filename}.doc`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
