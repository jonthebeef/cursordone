import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { getNextRef, getCurrentRef } from '../lib/ref-counter'

const TASKS_DIR = path.join(process.cwd(), 'tasks')
const REF_PREFIX = 'TSK-'

interface TaskRef {
  file: string
  ref: string
  number: number
}

async function getAllTaskRefs(): Promise<TaskRef[]> {
  const files = await fs.readdir(TASKS_DIR)
  const refs: TaskRef[] = []

  for (const file of files) {
    if (!file.endsWith('.md')) continue
    
    const content = await fs.readFile(path.join(TASKS_DIR, file), 'utf-8')
    const { data } = matter(content)
    
    if (data.ref && data.ref.startsWith(REF_PREFIX)) {
      const number = parseInt(data.ref.replace(REF_PREFIX, ''))
      refs.push({ file, ref: data.ref, number })
    }
  }

  return refs.sort((a, b) => a.number - b.number)
}

async function validateSequence(refs: TaskRef[]): Promise<boolean> {
  let expectedNumber = 1
  const gaps: number[] = []
  const duplicates: TaskRef[] = []

  // Find gaps and duplicates
  for (let i = 0; i < refs.length; i++) {
    if (i > 0 && refs[i].number === refs[i-1].number) {
      duplicates.push(refs[i])
    }
    while (expectedNumber < refs[i].number) {
      gaps.push(expectedNumber)
      expectedNumber++
    }
    expectedNumber = refs[i].number + 1
  }

  // Report issues
  if (gaps.length > 0) {
    console.log('Found gaps in sequence:', gaps.map(n => `${REF_PREFIX}${String(n).padStart(3, '0')}`))
  }
  if (duplicates.length > 0) {
    console.log('Found duplicate refs:', duplicates.map(d => `${d.file}: ${d.ref}`))
  }

  return gaps.length === 0 && duplicates.length === 0
}

async function updateTaskRefs() {
  const files = await fs.readdir(TASKS_DIR)
  const existingRefs = await getAllTaskRefs()
  const isValid = await validateSequence(existingRefs)
  
  if (!isValid) {
    console.log('Warning: Existing refs have gaps or duplicates')
  }

  let updatedCount = 0

  for (const file of files) {
    if (!file.endsWith('.md')) continue
    
    const filePath = path.join(TASKS_DIR, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const { data, content: markdown } = matter(content)

    // Skip if already has a ref
    if (data.ref) continue

    // Get next ref from our counter system
    data.ref = getNextRef()
    updatedCount++

    // Write back to file
    const updatedContent = matter.stringify(markdown, data)
    await fs.writeFile(filePath, updatedContent)
    
    console.log(`Updated ${file} with ref ${data.ref}`)
  }

  return { updatedCount, isValid }
}

// Export for use in API
export { updateTaskRefs }

// Run if called directly
if (require.main === module) {
  updateTaskRefs().catch(console.error)
} 