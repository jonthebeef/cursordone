export interface TaskOrders {
  orders: {
    [key: string]: string[]
  }
}

// Get the key for the current filter context
export function getOrderKey(epic: string | null, tags: string[]): string {
  const parts: string[] = []
  
  if (epic) {
    parts.push(`epic:${epic}`)
  }
  
  if (tags.length > 0) {
    parts.push(...tags.map(tag => `tag:${tag}`))
  }
  
  return parts.length > 0 ? parts.join('+') : 'global'
} 