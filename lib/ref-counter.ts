import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const COUNTER_FILE = path.join(process.cwd(), 'ref-counter.json')
const TASKS_DIR = path.join(process.cwd(), 'tasks')
const LOCK_FILE = path.join(process.cwd(), '.ref-lock')

interface Counter {
  current: number
  usedRefs: string[]
}

// Simple file-based locking mechanism
function acquireLock(timeout = 5000): boolean {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      fs.writeFileSync(LOCK_FILE, String(Date.now()), { flag: 'wx' })
      return true
    } catch (err) {
      // Check if lock is stale (older than 30 seconds)
      try {
        const lockTime = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'))
        if (Date.now() - lockTime > 30000) {
          fs.unlinkSync(LOCK_FILE)
          continue
        }
      } catch (e) {
        // Lock file issues, try to recover
        try { fs.unlinkSync(LOCK_FILE) } catch (_) {}
      }
      // Wait a bit before retrying
      const wait = Math.floor(Math.random() * 100)
      new Promise(resolve => setTimeout(resolve, wait))
    }
  }
  return false
}

function releaseLock() {
  try {
    fs.unlinkSync(LOCK_FILE)
  } catch (_) {}
}

function getUsedRefs(): string[] {
  // Get all refs from existing tasks
  const files = fs.readdirSync(TASKS_DIR)
    .filter(file => file.endsWith('.md'))
  
  const usedRefs = new Set<string>()
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(TASKS_DIR, file), 'utf8')
      const { data } = matter(content)
      if (data.ref) {
        usedRefs.add(data.ref)
      }
    } catch (err) {
      console.error(`Error reading task file ${file}:`, err)
    }
  }
  
  return Array.from(usedRefs)
}

function initializeCounter(): Counter {
  const usedRefs = getUsedRefs()
  const maxRef = usedRefs.reduce((max, ref) => {
    const num = parseInt(ref.replace('TSK-', ''))
    return Math.max(max, isNaN(num) ? 0 : num)
  }, 0)
  
  return {
    current: maxRef,
    usedRefs
  }
}

export function getCurrentRef(): number {
  if (!fs.existsSync(COUNTER_FILE)) {
    const counter = initializeCounter()
    try {
      fs.writeFileSync(COUNTER_FILE, JSON.stringify(counter, null, 2))
    } catch (err) {
      console.error('Error writing counter file:', err)
    }
    return counter.current
  }
  try {
    const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')) as Counter
    return data.current
  } catch (err) {
    console.error('Error reading counter file:', err)
    const counter = initializeCounter()
    return counter.current
  }
}

export function getNextRef(): string {
  if (!acquireLock()) {
    throw new Error('Could not acquire lock for ref generation')
  }

  try {
    // Read current state
    let data: Counter
    if (!fs.existsSync(COUNTER_FILE)) {
      data = initializeCounter()
    } else {
      try {
        data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')) as Counter
      } catch (err) {
        console.error('Error reading counter file, reinitializing:', err)
        data = initializeCounter()
      }
    }

    // Get the latest used refs to ensure we have the most up-to-date state
    const latestUsedRefs = new Set(getUsedRefs())
    
    // Merge with tracked refs
    data.usedRefs.forEach(ref => latestUsedRefs.add(ref))
    data.usedRefs = Array.from(latestUsedRefs)
    
    // Find the highest ref number
    const maxRef = data.usedRefs.reduce((max, ref) => {
      const num = parseInt(ref.replace('TSK-', ''))
      return Math.max(max, isNaN(num) ? 0 : num)
    }, data.current)
    
    // Set the next ref number
    const next = maxRef + 1
    const nextRef = formatRef(next)
    
    // Verify the ref is truly unique
    if (latestUsedRefs.has(nextRef)) {
      throw new Error(`Generated ref ${nextRef} is already in use`)
    }
    
    // Update the counter file
    data.current = next
    data.usedRefs.push(nextRef)
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2))

    return nextRef
  } finally {
    releaseLock()
  }
}

export function formatRef(ref: string | number): string {
  if (typeof ref === 'number') {
    return `TSK-${String(ref).padStart(3, '0')}`
  }
  return ref
}

export function markRefAsUnused(ref: string): void {
  if (!acquireLock()) {
    console.warn('Could not acquire lock for marking ref as unused')
    return
  }

  try {
    if (!fs.existsSync(COUNTER_FILE)) {
      return
    }
    
    const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8')) as Counter
    data.usedRefs = data.usedRefs.filter(r => r !== ref)
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error marking ref as unused:', err)
  } finally {
    releaseLock()
  }
} 