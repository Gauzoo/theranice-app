import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FALLBACK_NEXT_PATH = '/reset-password'
const RESET_REQUEST_PATH = '/mot-de-passe-oublie'

const sanitizeNextPath = (rawNext: string | null) => {
  if (!rawNext) {
    return FALLBACK_NEXT_PATH
  }

  if (!rawNext.startsWith('/') || rawNext.startsWith('//')) {
    return FALLBACK_NEXT_PATH
  }

  return rawNext
}

const getPublicSiteOrigin = (requestOrigin: string) => {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (!configuredSiteUrl) {
    return requestOrigin
  }

  try {
    return new URL(configuredSiteUrl).origin
  } catch {
    return requestOrigin
  }
}

const createRecoveryErrorRedirect = (siteOrigin: string, errorCode: string) => {
  const errorUrl = new URL(RESET_REQUEST_PATH, siteOrigin)
  errorUrl.searchParams.set('error', errorCode)
  return NextResponse.redirect(errorUrl)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const nextPath = sanitizeNextPath(searchParams.get('next'))
  const siteOrigin = getPublicSiteOrigin(origin)

  try {
    const supabase = await createClient()

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Recovery callback exchangeCodeForSession error:', error)
        return createRecoveryErrorRedirect(siteOrigin, 'recovery_invalid')
      }
    } else if (tokenHash && type === 'recovery') {
      const { error } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash: tokenHash,
      })

      if (error) {
        console.error('Recovery callback verifyOtp error:', error)
        return createRecoveryErrorRedirect(siteOrigin, 'recovery_invalid')
      }
    } else {
      return createRecoveryErrorRedirect(siteOrigin, 'recovery_missing')
    }

    const isRecoveryFlow = type === 'recovery' || !!tokenHash || !!code
    const resolvedNextPath = isRecoveryFlow && nextPath === '/'
      ? FALLBACK_NEXT_PATH
      : nextPath

    const redirectUrl = new URL(resolvedNextPath, siteOrigin)
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Recovery callback unexpected error:', error)
    return createRecoveryErrorRedirect(siteOrigin, 'recovery_failed')
  }
}
