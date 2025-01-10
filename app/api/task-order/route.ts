import { NextRequest, NextResponse } from 'next/server'
import { getOrderForContext } from '@/lib/task-order-actions'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const epic = searchParams.get('epic')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []

    const order = await getOrderForContext(epic || null, tags)
    
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in task-order API route:', error)
    return NextResponse.json({ error: 'Failed to get task order' }, { status: 500 })
  }
} 