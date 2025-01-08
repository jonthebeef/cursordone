import fs from 'fs'
import path from 'path'

const COUNTER_FILE = path.join(process.cwd(), 'ref-counter.json')

interface Counter {
  current: number
}

export function getCurrentRef(): number {
  if (!fs.existsSync(COUNTER_FILE)) {
    fs.writeFileSync(COUNTER_FILE, JSON.stringify({ current: 0 }))
    return 0
  }
  const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'))
  return data.current
}

export function getNextRef(): string {
  const current = getCurrentRef()
  const next = current + 1
  fs.writeFileSync(COUNTER_FILE, JSON.stringify({ current: next }))
  return `TSK-${String(next).padStart(3, '0')}`
}

export function formatRef(ref: string | number): string {
  if (typeof ref === 'number') {
    return `TSK-${String(ref).padStart(3, '0')}`
  }
  return ref
} 