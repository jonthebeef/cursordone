import { NextResponse } from 'next/server'
import { updateTaskRefs } from '@/scripts/update-task-refs'

export async function POST() {
  try {
    const result = await updateTaskRefs()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating refs:', error)
    return NextResponse.json(
      { error: 'Failed to update refs' },
      { status: 500 }
    )
  }
} 