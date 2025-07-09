import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request) {
  const { supabase, response } = createClient(request)
  const { pathname } = request.nextUrl

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()

  // Simple redirect for /dashboard to /projects for now
  // The project logic will be handled in the pages themselves
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/projects', request.url))
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
     * - api routes (handled separately)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}