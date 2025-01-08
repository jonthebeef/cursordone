'use server'

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface Epic {
  id: string           // Slug-style ID (e.g., 'user-interface')
  title: string        // Display title (e.g., 'User Interface')
  description: string  // Detailed description of the epic
  status: 'active' | 'completed' | 'planned'
  priority: 'low' | 'medium' | 'high'
  created: string     // ISO date string
  tags?: string[]
  content?: string    // Additional markdown content
}

const EPICS_DIR = path.join(process.cwd(), 'epics')

export async function getAllEpics(): Promise<Epic[]> {
  if (!fs.existsSync(EPICS_DIR)) {
    fs.mkdirSync(EPICS_DIR, { recursive: true })
  }

  const files = fs.readdirSync(EPICS_DIR)
    .filter(file => file.endsWith('.md'))

  const epics: Epic[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(EPICS_DIR, file), 'utf8')
    const { data, content: markdown } = matter(content)
    epics.push({
      id: path.basename(file, '.md'),
      ...data,
      content: markdown.trim(),
      created: data.created?.toString() || new Date().toISOString().split('T')[0]
    } as Epic)
  }

  return epics
}

export async function getEpic(id: string): Promise<Epic | null> {
  const filepath = path.join(EPICS_DIR, `${id}.md`)
  if (!fs.existsSync(filepath)) return null

  const content = fs.readFileSync(filepath, 'utf8')
  const { data, content: markdown } = matter(content)
  return {
    id,
    ...data,
    content: markdown.trim()
  } as Epic
}

export async function createEpic(epic: Omit<Epic, 'id'> & { content: string }): Promise<string> {
  const id = epic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const filepath = path.join(EPICS_DIR, `${id}.md`)

  const frontmatter = {
    title: epic.title,
    description: epic.description,
    status: epic.status,
    priority: epic.priority,
    tags: epic.tags || [],
    created: epic.created
  }

  const fileContent = matter.stringify(epic.content, frontmatter)
  fs.writeFileSync(filepath, fileContent)
  return id
}

export async function updateEpic(id: string, epic: Omit<Epic, 'id'>): Promise<void> {
  const filepath = path.join(EPICS_DIR, `${id}.md`)
  
  const frontmatter = {
    title: epic.title,
    description: epic.description,
    status: epic.status,
    priority: epic.priority,
    tags: epic.tags || [],
    created: epic.created
  }

  const fileContent = matter.stringify(epic.content || '', frontmatter)
  fs.writeFileSync(filepath, fileContent)
}

export async function deleteEpic(id: string): Promise<void> {
  const filepath = path.join(EPICS_DIR, `${id}.md`)
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
  }
} 