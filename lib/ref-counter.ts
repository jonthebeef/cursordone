import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const COUNTER_FILE = path.join(process.cwd(), 'ref-counter.json')
const TASKS_DIR = path.join(process.cwd(), 'tasks')

interface Counter {
  current: number
  usedRefs: string[]  // Track all refs that have been used
}

function getUsedRefs(): string[] {
  // Get all refs from existing tasks
  const files = fs.readdirSync(TASKS_DIR)
    .filter(file => file.endsWith('.md'))
  
  const usedRefs: string[] = []
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(TASKS_DIR, file), 'utf8')
    const { data } = matter(content)
    if (data.ref) {
      usedRefs.push(data.ref)
    }
  }
  
  return usedRefs
}

function initializeCounter(): Counter {
  const usedRefs = getUsedRefs()
  const maxRef = usedRefs.reduce((max, ref) => {
    const num = parseInt(ref.replace('TSK-', ''))
    return Math.max(max, num)
  }, 0)
  
  return {
    current: maxRef,
    usedRefs
  }
}

export function getCurrentRef(): number {
  if (!fs.existsSync(COUNTER_FILE)) {
    const counter = initializeCounter()
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(counter, null, 2))
    return counter.current
  }
  const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')) as Counter
  return data.current
}

export function getNextRef(): string {
  // Read current state
  let data: Counter
  if (!fs.existsSync(COUNTER_FILE)) {
    data = initializeCounter()
  } else {
    data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')) as Counter
  }

  // Get the latest used refs to ensure we have the most up-to-date state
  data.usedRefs = getUsedRefs()
  
  // Always increment from the highest number used
  const maxRef = data.usedRefs.reduce((max, ref) => {
    const num = parseInt(ref.replace('TSK-', ''))
    return Math.max(max, num)
  }, data.current)
  
  // Set the next ref number
  const next = maxRef + 1
  const nextRef = `TSK-${String(next).padStart(3, '0')}`
  
  // Update the counter file
  data.current = next
  data.usedRefs.push(nextRef)
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2))

  return nextRef
}

export function formatRef(ref: string | number): string {
  if (typeof ref === 'number') {
    return `TSK-${String(ref).padStart(3, '0')}`
  }
  return ref
}

export function markRefAsUnused(ref: string): void {
  if (!fs.existsSync(COUNTER_FILE)) {
    return
  }
  
  const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')) as Counter
  data.usedRefs = data.usedRefs.filter(r => r !== ref)
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2))
} 