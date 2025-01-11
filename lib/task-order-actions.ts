'use server'

import fs from 'fs'
import path from 'path'
import { getOrderKey, type TaskOrders } from './task-order'

const ORDERS_FILE = path.join(process.cwd(), 'task-orders.json')

// Ensure the orders file exists
function ensureOrdersFile() {
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify({ orders: { global: [] } }, null, 2))
  }
}

// Read the task orders from the JSON file
export async function getTaskOrders(): Promise<TaskOrders> {
  try {
    ensureOrdersFile()
    const content = await fs.promises.readFile(ORDERS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error reading task orders:', error)
    return { orders: { global: [] } }
  }
}

// Save task orders to the JSON file
export async function saveTaskOrder(key: string, order: string[]): Promise<void> {
  try {
    ensureOrdersFile()
    
    console.log('\n=== Saving Task Order ===')
    console.log(`Key: ${key}`)
    
    // Read current orders first to prevent race conditions
    const orders = await getTaskOrders()
    
    // Only update if order has actually changed
    const currentOrder = orders.orders[key] || []
    if (JSON.stringify(currentOrder) === JSON.stringify(order)) {
      console.log('Order unchanged, skipping save')
      return
    }
    
    // Update the order
    orders.orders[key] = order
    
    // Write to a temp file first
    const tempFile = `${ORDERS_FILE}.tmp`
    const contentToWrite = JSON.stringify(orders, null, 2)
    
    await fs.promises.writeFile(tempFile, contentToWrite)
    await fs.promises.rename(tempFile, ORDERS_FILE)
    console.log('Order saved successfully')
  } catch (error) {
    console.error('Error saving task order:', error)
    throw new Error('Failed to save task order')
  }
}

// Get the task order for a specific context
export async function getOrderForContext(epic: string | null, tags: string[]): Promise<string[]> {
  try {
    const orders = await getTaskOrders()
    const key = getOrderKey(epic, tags)
    
    // Try exact match first
    if (orders.orders[key]) {
      return orders.orders[key]
    }
    
    // Try partial matches if we have filters
    if (epic || tags.length > 0) {
      // Try epic-only match if we have both epic and tags
      if (epic && tags.length > 0) {
        const epicKey = getOrderKey(epic, [])
        if (orders.orders[epicKey]) {
          return orders.orders[epicKey]
        }
      }
      
      // Try tag-only matches if we have multiple filters
      if (tags.length > 0) {
        for (const tag of tags) {
          const tagKey = getOrderKey(null, [tag])
          if (orders.orders[tagKey]) {
            return orders.orders[tagKey]
          }
        }
      }
    }
    
    // Fall back to global order
    return orders.orders.global || []
  } catch (error) {
    console.error('Error getting order for context:', error)
    return []
  }
}

// Initialize task order if it doesn't exist
export async function initializeTaskOrder(tasks: string[]): Promise<void> {
  try {
    ensureOrdersFile()
    const orders = await getTaskOrders()
    
    if (!orders.orders.global || orders.orders.global.length === 0) {
      orders.orders.global = tasks
      await fs.promises.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2))
    }
  } catch (error) {
    console.error('Error initializing task order:', error)
  }
} 