// ============================================================
// lib/network-error.ts
// A fetch() call that never reaches the server (offline, DNS
// failure, timeout) throws a generic TypeError — browsers give it
// the same "Failed to fetch" / "NetworkError when attempting to
// fetch resource" message regardless of cause. That's the case this
// helper catches and turns into a message a non-technical user can
// actually act on, instead of a silent console.error() or a raw
// "Failed to fetch [job/teacher/whatever]" that reads like a bug.
//
// A response that came back but wasn't ok (404, 500, etc.) is a
// different situation — the request reached the server — so callers
// should keep their own specific message for that case and only use
// this for the catch block around the fetch itself.
// ============================================================

export function isNetworkError(err: unknown): boolean {
  return (
    err instanceof TypeError &&
    /fetch|network/i.test(err.message)
  )
}

export function getFetchErrorMessage(err: unknown, fallback: string): string {
  if (isNetworkError(err)) {
    return "Failed. Check your internet connection."
  }
  return fallback
}
