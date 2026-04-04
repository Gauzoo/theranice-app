import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'
  // Validate next param to prevent open redirect
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Detect password recovery via AMR claims in the session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const amr = (data.session?.user as any)?.amr
      const isRecovery = amr?.some((entry: { method: string }) => entry.method === 'recovery')
      if (isRecovery) {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/connexion?error=auth`)
}
