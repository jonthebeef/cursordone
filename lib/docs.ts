'use server'

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface Doc {
  title: string
  description: string
  content?: string
  type: 'documentation' | 'architecture' | 'guide' | 'api' | 'delivery' | 'product' | 'business' | 'design' | 'stakeholders' | 'operations'
  tags: string[]
  created: string
  filename: string
  epic?: string
  dependencies?: string[]
}

interface DocFrontmatter {
  title: string
  description: string
  type: string
  tags: string[]
  created: string
  epic?: string
  dependencies?: string[]
}

const DOCS_DIR = path.join(process.cwd(), 'docs')

export async function getAllDocs(): Promise<Doc[]> {
  // Ensure directory exists
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true })
  }

  // Get all markdown files
  const files = fs.readdirSync(DOCS_DIR)
    .filter(file => file.endsWith('.md'))

  // Parse all docs
  const docs: Doc[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(DOCS_DIR, file), 'utf8')
    const { data, content: markdown } = matter(content)
    docs.push({
      filename: file,
      ...data,
      content: markdown.trim()
    } as Doc)
  }

  return docs
}

export async function createDoc(doc: Omit<Doc, 'filename'> & { content: string }): Promise<string> {
  const filename = `${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
  const filePath = path.join(DOCS_DIR, filename)
  
  const frontmatter: DocFrontmatter = {
    title: doc.title,
    description: doc.description,
    type: doc.type,
    tags: doc.tags || [],
    created: doc.created,
    epic: doc.epic,
    dependencies: doc.dependencies || []
  }

  // Remove undefined values to prevent YAML errors
  Object.keys(frontmatter).forEach(key => {
    const k = key as keyof DocFrontmatter
    if (frontmatter[k] === undefined) {
      delete frontmatter[k]
    }
  })
  
  const fileContent = matter.stringify(doc.content, frontmatter)
  fs.writeFileSync(filePath, fileContent)
  return filename
}

export async function updateDoc(filename: string, doc: Omit<Doc, 'filename'>) {
  const filePath = path.join(DOCS_DIR, filename)
  
  const frontmatter: DocFrontmatter = {
    title: doc.title,
    description: doc.description,
    type: doc.type,
    tags: doc.tags || [],
    created: doc.created,
    epic: doc.epic,
    dependencies: doc.dependencies || []
  }

  // Remove undefined values to prevent YAML errors
  Object.keys(frontmatter).forEach(key => {
    const k = key as keyof DocFrontmatter
    if (frontmatter[k] === undefined) {
      delete frontmatter[k]
    }
  })
  
  const fileContent = matter.stringify(doc.content || '', frontmatter)
  fs.writeFileSync(filePath, fileContent)
}

export async function deleteDoc(filename: string) {
  const filePath = path.join(DOCS_DIR, filename)
  if (fs.existsSync(filePath)) {
    // Find and delete associated images
    const content = fs.readFileSync(filePath, 'utf8')
    const { content: markdown } = matter(content)
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

    // Delete the doc file
    fs.unlinkSync(filePath)
  }
} 