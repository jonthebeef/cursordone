import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const starredTagsFile = path.join(process.cwd(), 'data', 'starred-tags.json')

// Ensure the data directory exists
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir)
  }
}

// Load starred tags
async function loadStarredTags(): Promise<string[]> {
  try {
    await ensureDataDir()
    const content = await fs.readFile(starredTagsFile, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

// Save starred tags
async function saveStarredTags(tags: string[]) {
  await ensureDataDir()
  await fs.writeFile(starredTagsFile, JSON.stringify(tags, null, 2))
}

// GET handler
export async function GET() {
  const starredTags = await loadStarredTags()
  return NextResponse.json(starredTags)
}

// POST handler
export async function POST(request: Request) {
  try {
    const { tag, action } = await request.json()
    if (!tag || !action) {
      return NextResponse.json(
        { error: 'Missing tag or action' },
        { status: 400 }
      )
    }

    const starredTags = await loadStarredTags()
    
    if (action === 'star') {
      if (!starredTags.includes(tag)) {
        starredTags.push(tag)
      }
    } else if (action === 'unstar') {
      const index = starredTags.indexOf(tag)
      if (index !== -1) {
        starredTags.splice(index, 1)
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    await saveStarredTags(starredTags)
    return NextResponse.json(starredTags)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update starred tags' },
      { status: 500 }
    )
  }
} 