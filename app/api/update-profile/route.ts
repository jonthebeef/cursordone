import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log('Received profile update request')
    const { name, avatarUrl } = await request.json()
    console.log('Update data:', { name, avatarUrl })

    if (!name && !avatarUrl) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: "Name or avatar URL is required" },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    console.log('Created Supabase client')

    // Get authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session response:', { session: session?.user?.id, error: sessionError })
    
    if (sessionError || !session?.user) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      )
    }

    const { user } = session
    console.log('Updating profile for user:', user.id)

    // Update profile using upsert
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update profile:', updateError)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    console.log('Profile updated successfully:', profile)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
} 