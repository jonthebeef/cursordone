import { NextResponse } from 'next/server'
import { z } from 'zod'

type FeatureFlags = {
  enabled: boolean
  model: 'deepseek-chat-r1' | 'deepseek-chat-v3' | null
  max_daily_tokens: number
  max_request_tokens: number
}

// In production, this would come from your database or config service
let featureFlags: FeatureFlags = {
  enabled: true,
  model: 'deepseek-chat-r1',
  max_daily_tokens: 100000,
  max_request_tokens: 2048
}

const FeatureFlagsSchema = z.object({
  enabled: z.boolean(),
  model: z.union([
    z.enum(['deepseek-chat-r1', 'deepseek-chat-v3']),
    z.null()
  ]),
  max_daily_tokens: z.number().optional(),
  max_request_tokens: z.number().optional()
})

export async function GET() {
  return NextResponse.json(featureFlags)
}

export async function PUT(request: Request) {
  try {
    const updates = await request.json()
    const validated = FeatureFlagsSchema.parse(updates)
    
    featureFlags = {
      ...featureFlags,
      ...validated
    }
    
    return NextResponse.json(featureFlags)
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid feature flag updates' },
      { status: 400 }
    )
  }
} 