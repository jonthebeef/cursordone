import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const email = String(formData.get('email'))
  const password = String(formData.get('password'))
  const isSignUp = formData.get('signup') === 'true'
  
  const response = new NextResponse()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get(`cookie-${name}`) ?? ''
        },
        set(name: string, value: string, options: any) {
          response.headers.set(
            'set-cookie',
            `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`
          )
        },
        remove(name: string) {
          response.headers.set(
            'set-cookie',
            `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
          )
        },
      },
    }
  )

  const { error } = isSignUp
    ? await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${requestUrl.origin}/auth/callback`,
        },
      })
    : await supabase.auth.signInWithPassword({
        email,
        password,
      })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.redirect(requestUrl.origin, {
    status: 301,
    headers: response.headers,
  })
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const response = new NextResponse()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.headers.get(`cookie-${name}`) ?? ''
          },
          set(name: string, value: string, options: any) {
            response.headers.set(
              'set-cookie',
              `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`
            )
          },
          remove(name: string) {
            response.headers.set(
              'set-cookie',
              `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)

    return NextResponse.redirect(requestUrl.origin, {
      headers: response.headers,
    })
  }

  return NextResponse.redirect(requestUrl.origin)
} 