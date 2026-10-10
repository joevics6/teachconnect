// ============================================================
// lib/og-card.tsx
// Shared 1200x630 share-card layout for next/og ImageResponse, used by
// the opengraph-image files for jobs, resources and blog posts. A card
// that names the actual role/guide is what makes a shared link
// (WhatsApp, X, LinkedIn) get opened instead of scrolled past.
// ============================================================

import { ImageResponse } from "next/og"

export const OG_SIZE = { width: 1200, height: 630 }

interface CardProps {
  kicker: string          // small label above the title, e.g. "TEACHING JOB"
  title: string
  subtitle?: string | null
  pills?: (string | null | undefined)[]
}

export function ogCard({ kicker, title, subtitle, pills = [] }: CardProps) {
  const shown = title.length > 90 ? `${title.slice(0, 87)}…` : title
  const fontSize = shown.length > 60 ? 54 : shown.length > 38 ? 64 : 76
  const chips = pills.filter(Boolean) as string[]

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #16233F 0%, #283A57 60%, #33507A 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: "#9FB3D4", fontWeight: 700 }}>
            {kicker.toUpperCase()}
          </div>
          <div style={{ display: "flex", fontSize, fontWeight: 800, lineHeight: 1.1, marginTop: 28 }}>{shown}</div>
          {subtitle ? (
            <div style={{ display: "flex", fontSize: 36, color: "#D3DDEE", marginTop: 24 }}>{subtitle}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {chips.slice(0, 3).map((c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.14)",
                  fontSize: 26,
                  fontWeight: 600,
                }}
              >
                {c}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800 }}>ClassHire</div>
        </div>
      </div>
    ),
    OG_SIZE
  )
}
