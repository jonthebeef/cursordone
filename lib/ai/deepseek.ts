import { z } from 'zod'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-2ccda9689c7e4810a3237d8881437f0e'
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v2'

export interface DeepseekConfig {
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  temperature: number
  presence_penalty: number
  frequency_penalty: number
}

export interface EnhancementRequest {
  content: string
  context?: {
    relatedTasks?: string[]
    epic?: string
    tags?: string[]
    userRequest?: string
  }
  onProgress?: (chunk: string) => void
}

export interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost: number
}

export interface EnhancementResponse {
  enhanced: string
  changes: {
    type: 'addition' | 'modification' | 'removal'
    description: string
  }[]
  usage?: TokenUsage
}

export interface FeatureFlags {
  enabled: boolean
  model: 'deepseek-chat-r1' | 'deepseek-chat-v3' | null
  max_daily_tokens?: number
  max_request_tokens?: number
}

const defaultConfig: DeepseekConfig = {
  apiKey: DEEPSEEK_API_KEY,
  baseUrl: DEEPSEEK_BASE_URL,
  model: 'deepseek-chat-r1',
  maxTokens: 2048,
  temperature: 0.3,
  presence_penalty: 0.1,
  frequency_penalty: 0.1
}

const enhancementPrompt = `
You are a senior product manager with 10 years of experience, combined with expertise in technical writing and task management. Your job is to enhance and improve task descriptions to be more:
- Detailed and specific
- Well-structured
- Clear and professional
- Aligned with project context and business goals
- Focused on user value and impact

Given the content and context below, please enhance the content while maintaining its core meaning.

Content:
{content}

Project Context:
{context}

Return your response in the following JSON format:
{
  "enhanced": "The enhanced content...",
  "changes": [
    {
      "type": "addition | modification | removal",
      "description": "Description of what was changed"
    }
  ]
}
`

export class DeepseekAPI {
  private config: DeepseekConfig
  private featureFlags: FeatureFlags | null = null
  private lastFlagsFetch: number = 0
  private readonly FLAG_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(config: Partial<DeepseekConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  private async getFeatureFlags(): Promise<FeatureFlags> {
    // If we have cached flags and they're not expired, use them
    if (this.featureFlags && Date.now() - this.lastFlagsFetch < this.FLAG_CACHE_TTL) {
      return this.featureFlags
    }

    try {
      // Fetch flags from your backend/config service
      const response = await fetch('/api/feature-flags/ai-enhancement')
      if (!response.ok) throw new Error('Failed to fetch feature flags')
      
      const flags: FeatureFlags = await response.json()
      this.featureFlags = flags
      this.lastFlagsFetch = Date.now()
      return flags
    } catch (error) {
      console.error('Error fetching feature flags:', error)
      // Default to disabled if we can't fetch flags
      return { enabled: false, model: null }
    }
  }

  private calculateCost(usage: TokenUsage): number {
    // Adjust these rates based on actual DeepSeek pricing
    const RATE_PER_1K_TOKENS = 0.002
    return (usage.total_tokens / 1000) * RATE_PER_1K_TOKENS
  }

  async enhanceContent(request: EnhancementRequest): Promise<EnhancementResponse> {
    // Check feature flags first
    const flags = await this.getFeatureFlags()
    if (!flags.enabled) {
      throw new Error('AI enhancement is currently disabled')
    }

    // Use the model specified in flags, or fall back to config
    const model = flags.model || this.config.model

    const prompt = enhancementPrompt
      .replace('{content}', request.content)
      .replace('{context}', JSON.stringify(request.context, null, 2))

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a senior product manager with 10 years of experience, combined with expertise in technical writing and task management.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: flags.max_request_tokens || this.config.maxTokens,
        temperature: this.config.temperature,
        presence_penalty: this.config.presence_penalty,
        frequency_penalty: this.config.frequency_penalty,
        stream: true,
        response_format: { 
          type: "json_object",
          schema: {
            type: "object",
            properties: {
              enhanced: { type: "string" },
              changes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["addition", "modification", "removal"] },
                    description: { type: "string" }
                  }
                }
              }
            }
          }
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`DeepSeek API error: ${error}`)
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    let result = ''
    
    if (reader) {
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        result += chunk
        
        // Call progress callback if provided
        if (request.onProgress) {
          request.onProgress(chunk)
        }
      }
    }
    
    let jsonResponse
    try {
      jsonResponse = JSON.parse(result)
    } catch (err) {
      console.error('Failed to parse JSON response:', err)
      throw new Error('Invalid JSON response from DeepSeek API')
    }
    
    // Validate response format
    const ResponseSchema = z.object({
      enhanced: z.string(),
      changes: z.array(z.object({
        type: z.enum(['addition', 'modification', 'removal']),
        description: z.string()
      }))
    })

    try {
      const parsed = ResponseSchema.parse(jsonResponse)

      // Add usage to the response
      const usage = jsonResponse.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
      
      usage.estimated_cost = this.calculateCost(usage)

      // Track usage (implement this based on your analytics/monitoring solution)
      this.trackUsage(usage).catch(console.error)

      return {
        ...parsed,
        usage
      }
    } catch (err) {
      console.error('Invalid response format:', err)
      throw new Error('Invalid response format from DeepSeek API')
    }
  }

  private async trackUsage(usage: TokenUsage): Promise<void> {
    try {
      await fetch('/api/metrics/ai-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          model: this.config.model,
          ...usage
        })
      })
    } catch (error) {
      console.error('Failed to track usage:', error)
    }
  }
} 