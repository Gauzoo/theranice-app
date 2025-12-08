import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const supabase = await createClient()

  // Check if a user's logged in
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  // Supprime manuellement tous les cookies Supabase
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.delete(cookie.name)
    }
  }

  revalidatePath('/', 'layout')
  
  const response = NextResponse.redirect(new URL('/', req.url), {
    status: 302,
  })

  // Ajoute des headers pour forcer la suppression des cookies
  response.cookies.set({
    name: 'sb-access-token',
    value: '',
    maxAge: -1,
    path: '/',
  })

  response.cookies.set({
    name: 'sb-refresh-token',
    value: '',
    maxAge: -1,
    path: '/',
  })

  return response
}
