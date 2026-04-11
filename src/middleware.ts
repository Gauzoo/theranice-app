import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

const ROOT_PATH = '/'
const AUTH_CALLBACK_PATH = '/auth/callback'
const RESET_PASSWORD_PATH = '/reset-password'

const hasRecoveryIntent = (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const nextParam = searchParams.get('next')
  const hasCodeWithoutOAuthState = searchParams.has('code') && !searchParams.has('state')

  return (
    searchParams.get('type') === 'recovery'
    || searchParams.has('token_hash')
    || nextParam === RESET_PASSWORD_PATH
    || hasCodeWithoutOAuthState
  )
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === ROOT_PATH && hasRecoveryIntent(request)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = AUTH_CALLBACK_PATH

    const nextParam = redirectUrl.searchParams.get('next')
    if (!nextParam || nextParam === ROOT_PATH) {
      redirectUrl.searchParams.set('next', RESET_PASSWORD_PATH)
    }

    return NextResponse.redirect(redirectUrl)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not ignore this!
  // This will refresh session if needed - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  let user = null
  try {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    user = currentUser
  } catch (e) {
    // En cas d'erreur réseau (fetch failed), on ne bloque pas l'application
    console.error('Middleware auth error:', e)
  }

  const isProfilRoute = request.nextUrl.pathname.startsWith('/profil')
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

  // Protection des routes authentifiées
  if (!user && (isProfilRoute || isAdminRoute)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/connexion'
    return NextResponse.redirect(redirectUrl)
  }

  // Protection des routes admin
  if (isAdminRoute) {
    const email = user?.email?.toLowerCase() || ''
    if (!ADMIN_EMAILS.includes(email)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (webhooks)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
