import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (code) {
    const redirectUrl = new URL('/reset-password', origin)
    redirectUrl.searchParams.set('code', code)
    return NextResponse.redirect(redirectUrl)
  }

  if (tokenHash && type === 'recovery') {
    const redirectUrl = new URL('/reset-password', origin)
    redirectUrl.searchParams.set('token_hash', tokenHash)
    redirectUrl.searchParams.set('type', type)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.redirect(`${origin}/connexion?error=auth`)
}
