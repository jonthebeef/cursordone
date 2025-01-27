import { NextResponse } from 'next/server'
import { writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('avatar') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and user ID are required' },
        { status: 400 }
      )
    }

    // Ensure avatars directory exists
    const avatarsDir = join(process.cwd(), 'public', 'avatars')
    if (!existsSync(avatarsDir)) {
      await mkdir(avatarsDir, { recursive: true })
    }

    // Clean up old avatars for this user
    const files = await readdir(avatarsDir)
    for (const existingFile of files) {
      if (existingFile.startsWith(userId)) {
        await unlink(join(avatarsDir, existingFile))
      }
    }

    // Get file extension
    const ext = file.name.split('.').pop()
    const filename = `${userId}.${ext}`
    const filepath = join(avatarsDir, filename)

    // Write the new file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the public URL
    const avatarUrl = `/avatars/${filename}`
    
    return NextResponse.json({ avatarUrl })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
} 