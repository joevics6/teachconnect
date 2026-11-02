// ============================================================
// lib/tools/doc.ts
// The one document model every tool outputs. A tool builds a ToolDoc (a list
// of simple blocks); the same doc is then shown on screen, downloaded as PDF
// (lib/tools/pdf.ts) or Word, or copied as plain text. Adding a tool means
// writing "inputs -> ToolDoc" — the output side is shared.
// ============================================================

export type Block =
  | { type: "title"; text: string; subtitle?: string }
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  /** Label/value pairs, laid out in two columns. */
  | { type: "fields"; rows: [string, string][] }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "table"; head: string[]; rows: string[][]; widths?: number[] }

export interface ToolDoc {
  title: string
  /** File name without extension. */
  filename: string
  blocks: Block[]
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const multiline = (s: string) => esc(s).replace(/\n/g, "<br>")

export function docToText(doc: ToolDoc): string {
  const out: string[] = []
  for (const b of doc.blocks) {
    switch (b.type) {
      case "title":
        out.push(b.text.toUpperCase() + (b.subtitle ? `\n${b.subtitle}` : ""))
        break
      case "heading":
        out.push(`\n${b.text.toUpperCase()}`)
        break
      case "paragraph":
        out.push(b.text)
        break
      case "fields":
        out.push(b.rows.map(([k, v]) => `${k}: ${v}`).join("\n"))
        break
      case "list":
        out.push(b.items.map((it, i) => `${b.ordered ? `${i + 1}.` : "•"} ${it}`).join("\n"))
        break
      case "table":
        out.push(
          b.rows
            .map((row) => row.map((cell, i) => `${b.head[i] ?? ""}: ${cell}`).join("\n"))
            .join("\n\n")
        )
        break
    }
  }
  return out.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()
}

/** Full HTML page; Word and Google Docs open it as an editable document. */
export function docToHtml(doc: ToolDoc): string {
  const body = doc.blocks
    .map((b) => {
      switch (b.type) {
        case "title":
          return `<h1 style="color:#283A57;margin:0">${esc(b.text)}</h1>${b.subtitle ? `<p style="color:#555;margin:2px 0 12px">${esc(b.subtitle)}</p>` : ""}<hr>`
        case "heading":
          return `<h2 style="color:#283A57;font-size:14pt;margin:16px 0 4px">${esc(b.text)}</h2>`
        case "paragraph":
          return `<p>${multiline(b.text)}</p>`
        case "fields": {
          const cells: string[] = []
          for (let i = 0; i < b.rows.length; i += 2) {
            const [k1, v1] = b.rows[i]
            const [k2, v2] = b.rows[i + 1] ?? ["", ""]
            cells.push(
              `<tr><td style="background:#F3F5F9"><b>${esc(k1)}</b></td><td>${esc(v1)}</td><td style="background:#F3F5F9"><b>${esc(k2)}</b></td><td>${esc(v2)}</td></tr>`
            )
          }
          return `<table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%">${cells.join("")}</table>`
        }
        case "list": {
          const tag = b.ordered ? "ol" : "ul"
          return `<${tag}>${b.items.map((it) => `<li>${multiline(it)}</li>`).join("")}</${tag}>`
        }
        case "table":
          return `<table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%"><tr>${b.head
            .map((h) => `<th style="background:#283A57;color:#fff;text-align:left">${esc(h)}</th>`)
            .join("")}</tr>${b.rows
            .map((r) => `<tr>${r.map((c) => `<td valign="top">${multiline(c)}</td>`).join("")}</tr>`)
            .join("")}</table>`
      }
    })
    .join("\n")
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(doc.title)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4}</style></head><body>${body}<p style="color:#888;font-size:9pt;margin-top:24px">Generated free on ClassHire · classhire.com.ng/tools</p></body></html>`
}
