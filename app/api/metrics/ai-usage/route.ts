import { NextResponse } from 'next/server'
import { z } from 'zod'

// In production, this would be stored in a database
let usageMetrics: UsageMetric[] = []

interface UsageMetric {
  timestamp: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost: number
}

const UsageMetricSchema = z.object({
  timestamp: z.string(),
  model: z.string(),
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
  estimated_cost: z.number()
})

export async function POST(request: Request) {
  try {
    const metric = await request.json()
    const validated = UsageMetricSchema.parse(metric)
    
    usageMetrics.push(validated)
    
    // In production, you'd want to:
    // 1. Store in a database
    // 2. Track daily/monthly totals
    // 3. Set up alerts for thresholds
    // 4. Implement rate limiting
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid usage metric' },
      { status: 400 }
    )
  }
}

export async function GET() {
  // In production, you'd want to:
  // 1. Add authentication
  // 2. Add query parameters for filtering
  // 3. Add pagination
  // 4. Add aggregation options
  
  const summary = {
    total_requests: usageMetrics.length,
    total_tokens: usageMetrics.reduce((sum, m) => sum + m.total_tokens, 0),
    total_cost: usageMetrics.reduce((sum, m) => sum + m.estimated_cost, 0),
    by_model: Object.fromEntries(
      Array.from(new Set(usageMetrics.map(m => m.model))).map(model => {
        const modelMetrics = usageMetrics.filter(m => m.model === model)
        return [model, {
          requests: modelMetrics.length,
          tokens: modelMetrics.reduce((sum, m) => sum + m.total_tokens, 0),
          cost: modelMetrics.reduce((sum, m) => sum + m.estimated_cost, 0)
        }]
      })
    )
  }
  
  return NextResponse.json(summary)
} 