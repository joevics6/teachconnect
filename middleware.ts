import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // API routes handle their own auth internally (each one checks
  // supabase.auth.getUser() itself) — this middleware only guards pages.
  if (pathname.startsWith("/api")) {
    return supabaseResponse
  }

  // Everything else is protected by default; only a short allow-list of
  // pages should be reachable while signed out (job board, resources,
  // pricing, marketing/legal pages, auth flows, and public school profiles
  // that double as employer-branding pages linked from job listings).
  const publicPrefixes = [
    "/jobs",
    "/resources",
    "/pricing",
    "/contact",
    "/privacy",
    "/terms",
    "/schools", // school directory + /schools/[id] public profiles
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ]

  // Exact-path exceptions carved out of an otherwise-public prefix above:
  // /schools/me is the logged-in school's own redirect helper, not a
  // public profile, so it needs its own login gate.
  const exactProtectedPaths = ["/schools/me"]

  const isExplicitlyProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/apply") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/talent") ||
    pathname.startsWith("/profile/teacher") || // exposes phone + CV links, must be signed in
    exactProtectedPaths.includes(pathname)

  const isOnPublicPrefix =
    pathname === "/" ||
    publicPrefixes.some((p) => p !== "/" && pathname.startsWith(p))

  const isProtected = isExplicitlyProtected || !isOnPublicPrefix

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}