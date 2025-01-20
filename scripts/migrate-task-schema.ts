import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const TASKS_DIR = path.join(process.cwd(), 'tasks')

interface TaskData {
  ref?: string
  title?: string
  status?: 'todo' | 'in-progress' | 'done'
  priority?: 'low' | 'medium' | 'high'
  complexity?: 'XS' | 'S' | 'M' | 'L' | 'XL'
  epic?: string
  dependencies?: string[]
  tags?: string[]
  created?: string
  due_date?: string
  owner?: string
  completion_date?: string
  comments?: string
}

async function migrateTaskSchema() {
  // Get all markdown files
  const files = fs.readdirSync(TASKS_DIR)
    .filter(file => file.endsWith('.md'))

  for (const file of files) {
    try {
      const filePath = path.join(TASKS_DIR, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const { data, content: markdown } = matter(content)

      // Create a clean object with only existing values
      const cleanData: TaskData = {}
      
      // Only copy existing fields, don't add new ones
      if (data.ref) cleanData.ref = data.ref
      if (data.title) cleanData.title = data.title
      if (data.status) cleanData.status = data.status
      if (data.priority) cleanData.priority = data.priority
      if (data.complexity) cleanData.complexity = data.complexity
      if (data.epic) cleanData.epic = data.epic
      if (data.dependencies) cleanData.dependencies = data.dependencies
      if (data.tags) cleanData.tags = data.tags
      if (data.created) cleanData.created = data.created
      
      // Only include due_date, owner, and comments if they already exist
      // Explicitly NOT including completion_date as it hasn't been implemented yet
      if (data.due_date) cleanData.due_date = data.due_date
      if (data.owner) cleanData.owner = data.owner
      if (data.comments) cleanData.comments = data.comments

      // Create updated front matter
      const updatedContent = matter.stringify(markdown, cleanData)

      // Write back to file
      fs.writeFileSync(filePath, updatedContent)
      console.log(`Updated ${file}`)
    } catch (error) {
      console.error(`Error processing ${file}:`, error)
    }
  }

  console.log('Migration complete!')
}

migrateTaskSchema().catch(console.error) 