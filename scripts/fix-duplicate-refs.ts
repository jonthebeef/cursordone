import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getNextRef } from '../lib/ref-counter'

const TASKS_DIR = path.join(process.cwd(), 'tasks')
const REF_PREFIX = 'TSK-'

interface TaskRef {
  file: string
  ref: string
  number: number
  created: string
}

async function getAllTaskRefs(): Promise<TaskRef[]> {
  const files = fs.readdirSync(TASKS_DIR)
    .filter(file => file.endsWith('.md'))
  const refs: TaskRef[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(TASKS_DIR, file), 'utf-8')
    const { data } = matter(content)
    
    if (data.ref && data.ref.startsWith(REF_PREFIX)) {
      const number = parseInt(data.ref.replace(REF_PREFIX, ''))
      refs.push({ 
        file, 
        ref: data.ref, 
        number,
        created: data.created || '2024-01-01' // fallback date
      })
    }
  }

  return refs.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
}

async function fixDuplicateRefs() {
  console.log('Starting duplicate ref fix...')
  
  // Get all task refs
  const refs = await getAllTaskRefs()
  
  // Find duplicates
  const refCounts = new Map<string, TaskRef[]>()
  for (const ref of refs) {
    const existing = refCounts.get(ref.ref) || []
    existing.push(ref)
    refCounts.set(ref.ref, existing)
  }

  const duplicates = Array.from(refCounts.entries())
    .filter(([_, tasks]) => tasks.length > 1)

  if (duplicates.length === 0) {
    console.log('No duplicate refs found!')
    return
  }

  console.log(`Found ${duplicates.length} refs with duplicates:`)
  
  // Fix duplicates
  for (const [ref, tasks] of duplicates) {
    console.log(`\nFixing duplicate ref ${ref}:`)
    
    // Keep the oldest task's ref, update others
    const sortedTasks = tasks.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
    const original = sortedTasks[0]
    console.log(`- Keeping original ref in ${original.file} (created: ${original.created})`)
    
    // Update newer duplicates
    for (let i = 1; i < sortedTasks.length; i++) {
      const task = sortedTasks[i]
      const filePath = path.join(TASKS_DIR, task.file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const { data, content: markdown } = matter(content)
      
      // Get new unique ref
      const newRef = getNextRef()
      data.ref = newRef
      
      // Write back to file
      const updatedContent = matter.stringify(markdown, data)
      fs.writeFileSync(filePath, updatedContent)
      
      console.log(`- Updated ${task.file} with new ref ${newRef} (created: ${task.created})`)
    }
  }

  console.log('\nDuplicate ref fix complete!')
}

// Run if called directly
if (require.main === module) {
  fixDuplicateRefs().catch(console.error)
}

export { fixDuplicateRefs } 