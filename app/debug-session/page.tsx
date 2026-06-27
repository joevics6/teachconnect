// TEMPORARY DEBUG PAGE — delete after fixing
"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function DebugSessionPage() {
  const [info, setInfo] = useState<Record<string, unknown>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setInfo({
        has_session: !!session,
        session_error: error?.message ?? null,
        user_id: session?.user?.id ?? null,
        user_email: session?.user?.email ?? null,
        user_metadata: session?.user?.user_metadata ?? null,
        access_token_preview: session?.access_token ? session.access_token.slice(0, 20) + "..." : null,
        expires_at: session?.expires_at ?? null,
      })
    })
  }, [])

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13 }}>
      <h2>Client Session Debug</h2>
      <pre>{JSON.stringify(info, null, 2)}</pre>
      <hr />
      <h2>Server Session Debug</h2>
      <a href="/api/debug/me" target="_blank">/api/debug/me</a>
    </div>
  )
}
