import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const { supabase, response } = createClient(request)
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
      }

      // If user logged in successfully, check if we need to create a profile
      if (data.user) {
        try {
          // Try to create profile via the API endpoint
          const profileResponse = await fetch(`${origin}/api/auth/profile`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (!profileResponse.ok) {
            console.log('Profile creation response:', profileResponse.status)
          }
        } catch (profileError) {
          console.error('Error creating profile:', profileError)
          // Don't fail the login for profile creation errors
        }
      }

      const redirectResponse = NextResponse.redirect(`${origin}${next}`)
      
      // Merge cookies from the auth response
      const authCookies = response.headers.getSetCookie()
      authCookies.forEach(cookie => {
        redirectResponse.headers.append('Set-Cookie', cookie)
      })
      
      return redirectResponse
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}