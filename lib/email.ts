// ============================================================
// lib/email.ts
// Thin wrapper around Resend's REST API (no SDK dependency —
// consistent with how Paystack/Gemini are called elsewhere in this
// codebase: a plain fetch call, one shared helper).
//
// Requires RESEND_API_KEY. RESEND_FROM_EMAIL should be an address on
// a domain you've verified in Resend's dashboard (Domains → Add
// Domain, then add the DNS records it gives you) — until that's
// done, Resend will only actually deliver to the email address you
// signed up with, which is fine for testing but not for real users.
// ============================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "ClassHire <onboarding@resend.dev>"

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<{ sent: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — email not sent:", subject)
    return { sent: false, error: "RESEND_API_KEY not configured" }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const error = body?.message || `Resend responded ${res.status}`
      console.error("Resend send failed:", error)
      return { sent: false, error }
    }

    return { sent: true }
  } catch (err) {
    console.error("Resend send error:", err)
    return { sent: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

/** Simple branded shell around a title/message/CTA — shared by every notification email. */
export function renderNotificationEmail({
  title,
  message,
  ctaLabel = "View in ClassHire",
  ctaUrl,
}: {
  title: string
  message: string
  ctaLabel?: string
  ctaUrl: string
}): string {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background-color:#111827;padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;">ClassHire</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px 0;font-size:20px;color:#111827;">${title}</h1>
                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4b5563;">${message}</p>
                <a href="${ctaUrl}" style="display:inline-block;background-color:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">${ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #f3f4f6;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">You're receiving this because of your ClassHire notification preferences. You can change these anytime in your account settings.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
