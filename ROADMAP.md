# Todo List Project Roadmap

## Phase 1: Core Infrastructure ✅
- [x] Set up Next.js 14 project with App Router
- [x] Configure shadcn/ui components
  - Added Button, Card, Dialog, Checkbox components
- [x] Create basic file system operations for markdown files
  - Implemented getAllTasks(), createTask(), completeTask(), getTask()
  - Added TypeScript interfaces for Task management
- [x] Implement YAML frontmatter parser using gray-matter
- [x] Set up file organization structure
  - Created tasks/ directory for active tasks
  - Created tasks/completed/ for finished tasks

## Phase 2: Basic Task Management
- [ ] Create main task list view
  - Single column design
  - Task cards with title and priority
  - Completion checkbox
  - Priority indicator
- [ ] Implement task completion with file movement
  - Move completed tasks to completed/ directory
  - Add completion animation
- [ ] Create task detail overlay
  - Display full markdown content
  - Show metadata (dependencies, epic, priority)
  - Add links to dependent tasks

## Phase 3: Task Creation & Editing
- [ ] Build task creation interface
  - Title input
  - Priority selection
  - Dependencies (as URLs)
  - Epic/parent task fields
  - Created date (auto-generated)
- [ ] Implement markdown content editor
  - Basic textarea for content
  - Frontmatter handling
- [ ] Add file saving functionality
  - Generate proper filename from title
  - Save to correct location
  - Handle frontmatter generation

## Future Enhancements (Not Priority)
- [ ] Keyboard shortcuts
- [ ] Filtering and sorting
- [ ] Markdown preview
- [ ] Task relationship visualization
- [ ] Additional task statuses/columns

## Technical Specifications

### Task File Structure
```markdown
---
title: Task Title
status: todo | done
priority: low | medium | high
epic: string
parent: string
dependencies:
  - url1
  - url2
created: YYYY-MM-DD
---

Task content in markdown
```

### Directory Structure
```
/tasks
  /completed
    task-1.md
    task-2.md
  task-3.md
  task-4.md
``` 