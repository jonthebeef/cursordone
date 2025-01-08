import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getCurrentRef, formatRef } from '../lib/ref-counter'

const TASKS_DIR = path.join(process.cwd(), 'tasks')

async function migrateTaskRefs() {
  console.log('Starting task ref migration...')
  
  // Get all markdown files
  const files = fs.readdirSync(TASKS_DIR)
    .filter(file => file.endsWith('.md'))
  
  let maxRef = getCurrentRef()

  // Add refs to all tasks
  for (const file of files) {
    const filepath = path.join(TASKS_DIR, file)
    const content = fs.readFileSync(filepath, 'utf8')
    const { data, content: markdown } = matter(content)
    
    // Skip if already has ref
    if (data.ref) {
      const refNumber = parseInt(data.ref.replace('TSK-', ''))
      maxRef = Math.max(maxRef, refNumber)
      continue
    }

    // Add new ref
    maxRef++
    data.ref = formatRef(maxRef)
    
    // Write back to file
    const newContent = matter.stringify(markdown, data)
    fs.writeFileSync(filepath, newContent)
    console.log(`Added ref ${data.ref} to ${file}`)
  }

  // Update counter to highest ref
  fs.writeFileSync(
    path.join(process.cwd(), 'ref-counter.json'), 
    JSON.stringify({ current: maxRef })
  )
  
  console.log(`Migration complete. Highest ref: ${formatRef(maxRef)}`)
}

migrateTaskRefs().catch(console.error) 