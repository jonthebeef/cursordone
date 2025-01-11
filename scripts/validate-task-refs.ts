import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import chalk from 'chalk'
import { getNextRef } from '../lib/ref-counter'

const TASKS_DIR = path.join(process.cwd(), 'tasks')
const REF_PREFIX = 'TSK-'

interface TaskRef {
  file: string
  ref: string
  number: number
  created: string
}

interface ValidationResult {
  gaps: string[]
  duplicates: Map<string, TaskRef[]>
  missingRefs: string[]
  invalidRefs: string[]
  isValid: boolean
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
        created: data.created || '2024-01-01'
      })
    } else {
      refs.push({
        file,
        ref: '',
        number: -1,
        created: data.created || '2024-01-01'
      })
    }
  }

  return refs.sort((a, b) => a.number - b.number)
}

async function validateTaskRefs(autoFix: boolean = false): Promise<ValidationResult> {
  const refs = await getAllTaskRefs()
  const result: ValidationResult = {
    gaps: [],
    duplicates: new Map(),
    missingRefs: [],
    invalidRefs: [],
    isValid: true
  }

  // Check for missing and invalid refs
  for (const ref of refs) {
    if (!ref.ref) {
      result.missingRefs.push(ref.file)
      result.isValid = false
      continue
    }
    if (!ref.ref.match(/^TSK-\d{3}$/)) {
      result.invalidRefs.push(ref.file)
      result.isValid = false
    }
  }

  // Find duplicates
  const validRefs = refs.filter(r => r.number > 0)
  for (const ref of validRefs) {
    const matching = validRefs.filter(r => r.ref === ref.ref)
    if (matching.length > 1) {
      result.duplicates.set(ref.ref, matching)
      result.isValid = false
    }
  }

  // Find gaps
  const numbers = validRefs.map(r => r.number).sort((a, b) => a - b)
  let expectedNumber = 1
  for (const number of numbers) {
    while (expectedNumber < number) {
      result.gaps.push(`TSK-${String(expectedNumber).padStart(3, '0')}`)
      expectedNumber++
    }
    expectedNumber = number + 1
  }

  // Auto-fix if requested
  if (autoFix && !result.isValid) {
    console.log(chalk.yellow('\nAttempting to fix issues...'))

    // Fix missing refs
    for (const file of result.missingRefs) {
      const filePath = path.join(TASKS_DIR, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const { data, content: markdown } = matter(content)
      data.ref = getNextRef()
      const updatedContent = matter.stringify(markdown, data)
      fs.writeFileSync(filePath, updatedContent)
      console.log(chalk.green(`✓ Added ref ${data.ref} to ${file}`))
    }

    // Fix invalid refs
    for (const file of result.invalidRefs) {
      const filePath = path.join(TASKS_DIR, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const { data, content: markdown } = matter(content)
      data.ref = getNextRef()
      const updatedContent = matter.stringify(markdown, data)
      fs.writeFileSync(filePath, updatedContent)
      console.log(chalk.green(`✓ Fixed invalid ref in ${file} to ${data.ref}`))
    }

    // Fix duplicates
    for (const [ref, tasks] of result.duplicates) {
      const sortedTasks = tasks.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
      const original = sortedTasks[0]
      console.log(chalk.blue(`\nFixing duplicate ref ${ref}:`))
      console.log(chalk.gray(`- Keeping original ref in ${original.file}`))
      
      for (let i = 1; i < sortedTasks.length; i++) {
        const task = sortedTasks[i]
        const filePath = path.join(TASKS_DIR, task.file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const { data, content: markdown } = matter(content)
        const newRef = getNextRef()
        data.ref = newRef
        const updatedContent = matter.stringify(markdown, data)
        fs.writeFileSync(filePath, updatedContent)
        console.log(chalk.green(`✓ Updated ${task.file} with new ref ${newRef}`))
      }
    }
  }

  return result
}

function printValidationResult(result: ValidationResult) {
  console.log(chalk.bold('\nTask Reference Validation Report'))
  console.log('================================')

  if (result.isValid) {
    console.log(chalk.green('✓ All task references are valid!\n'))
    return
  }

  if (result.missingRefs.length > 0) {
    console.log(chalk.yellow('\nTasks missing refs:'))
    result.missingRefs.forEach(file => console.log(`- ${file}`))
  }

  if (result.invalidRefs.length > 0) {
    console.log(chalk.yellow('\nTasks with invalid refs:'))
    result.invalidRefs.forEach(file => console.log(`- ${file}`))
  }

  if (result.duplicates.size > 0) {
    console.log(chalk.yellow('\nDuplicate refs found:'))
    for (const [ref, tasks] of result.duplicates) {
      console.log(`\n${ref}:`)
      tasks.forEach(task => console.log(`- ${task.file} (created: ${task.created})`))
    }
  }

  if (result.gaps.length > 0) {
    console.log(chalk.blue('\nGaps in ref sequence:'))
    console.log(result.gaps.join(', '))
  }

  console.log('\nRun with --fix to automatically resolve these issues.')
}

// Run if called directly
if (require.main === module) {
  const autoFix = process.argv.includes('--fix')
  validateTaskRefs(autoFix)
    .then(result => {
      printValidationResult(result)
      process.exit(result.isValid ? 0 : 1)
    })
    .catch(error => {
      console.error(chalk.red('Error:', error))
      process.exit(1)
    })
}

export { validateTaskRefs, type ValidationResult } 