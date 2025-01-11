'use server'

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getNextRef, markRefAsUnused } from './ref-counter'

export interface Task {
  id: string
  ref: string
  filename: string
  title: string
  status: 'todo' | 'done'
  priority: 'low' | 'medium' | 'high'
  complexity?: 'XS' | 'S' | 'M' | 'L' | 'XL'
  epic?: string
  parent?: string
  dependencies?: string[]
  tags?: string[]
  created: string
  content?: string
}

interface TaskFrontmatter {
  ref: string
  title: string
  status: Task['status']
  priority: Task['priority']
  complexity?: Task['complexity']
  epic?: string
  parent?: string
  dependencies?: string[]
  tags?: string[]
  created: string
}

const TASKS_DIR = path.join(process.cwd(), 'tasks')

export async function getAllTasks(): Promise<Task[]> {
  // Ensure directory exists
  if (!fs.existsSync(TASKS_DIR)) {
    fs.mkdirSync(TASKS_DIR, { recursive: true })
  }

  // Get all markdown files
  const files = fs.readdirSync(TASKS_DIR)
    .filter(file => file.endsWith('.md'))

  // Parse all tasks
  const tasks: Task[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(TASKS_DIR, file), 'utf8')
    const { data, content: markdown } = matter(content)
    tasks.push({
      filename: file,
      ...data,
      content: markdown.trim()
    } as Task)
  }

  return tasks
}

export async function completeTask(filename: string): Promise<void> {
  const task = await getTask(filename)
  if (!task) throw new Error(`Task not found: ${filename}`)

  // Toggle the status
  task.status = task.status === 'done' ? 'todo' : 'done'
  
  // Update the file
  const filePath = path.join(TASKS_DIR, filename)
  await fs.promises.writeFile(filePath, await serializeTask(task))
}

export async function createTask(task: Omit<Task, 'filename' | 'content' | 'ref'> & { content: string }): Promise<string> {
  const filename = `${task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.md`
  const filePath = path.join(TASKS_DIR, filename)
  
  const frontmatter: TaskFrontmatter = {
    ref: getNextRef(),
    title: task.title,
    status: task.status,
    priority: task.priority,
    complexity: task.complexity,
    epic: task.epic ? task.epic.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined,
    parent: task.parent,
    dependencies: task.dependencies || [],
    tags: task.tags || [],
    created: task.created
  }

  // Remove undefined values to prevent YAML errors
  Object.keys(frontmatter).forEach(key => {
    const k = key as keyof TaskFrontmatter
    if (frontmatter[k] === undefined) {
      delete frontmatter[k]
    }
  })
  
  const fileContent = matter.stringify(task.content, frontmatter)
  fs.writeFileSync(filePath, fileContent)
  return filename
}

export async function updateTask(filename: string, task: Omit<Task, 'filename'>) {
  const filePath = path.join(TASKS_DIR, filename)
  
  const frontmatter: TaskFrontmatter = {
    ref: task.ref,
    title: task.title,
    status: task.status,
    priority: task.priority,
    complexity: task.complexity,
    epic: task.epic ? task.epic.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined,
    parent: task.parent,
    dependencies: task.dependencies || [],
    tags: task.tags || [],
    created: task.created
  }

  // Remove undefined values to prevent YAML errors
  Object.keys(frontmatter).forEach(key => {
    const k = key as keyof TaskFrontmatter
    if (frontmatter[k] === undefined) {
      delete frontmatter[k]
    }
  })
  
  const fileContent = matter.stringify(task.content || '', frontmatter)
  fs.writeFileSync(filePath, fileContent)
}

export async function deleteTask(filename: string) {
  const filePath = path.join(TASKS_DIR, filename)
  if (fs.existsSync(filePath)) {
    // Get the task's content before deleting
    const content = fs.readFileSync(filePath, 'utf8')
    const { data, content: markdown } = matter(content)
    
    // Handle ref cleanup
    if (data.ref) {
      markRefAsUnused(data.ref)
    }

    // Find and delete associated images
    const imageRegex = /!\[.*?\]\(\/task-images\/(.*?)\)/g
    const matches = [...markdown.matchAll(imageRegex)]
    
    if (matches.length > 0) {
      const imagesDir = path.join(process.cwd(), 'public', 'task-images')
      for (const match of matches) {
        const imagePath = path.join(imagesDir, match[1])
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath)
            console.log(`Deleted image: ${match[1]}`)
          }
        } catch (error) {
          console.error(`Failed to delete image ${match[1]}:`, error)
        }
      }
    }

    // Delete the task file
    fs.unlinkSync(filePath)
  }
}

async function getTask(filename: string): Promise<Task | null> {
  try {
    const filepath = path.join(TASKS_DIR, path.basename(filename))
    if (!fs.existsSync(filepath)) return null
    
    const content = await fs.promises.readFile(filepath, 'utf-8')
    const { data, content: markdown } = matter(content)
    return {
      filename: path.basename(filename),
      ...data,
      content: markdown.trim()
    } as Task
  } catch (error) {
    console.error('Error reading task:', error)
    return null
  }
}

async function serializeTask(task: Task): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content, filename, ...frontMatter } = task
  return matter.stringify(content || '', frontMatter)
} 