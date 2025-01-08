# Todo List Project Roadmap

## Phase 1: Core Infrastructure
- [ ] Set up Next.js 14 project with App Router
- [ ] Configure shadcn/ui components
- [ ] Create basic file system operations for markdown files
- [ ] Implement YAML frontmatter parser
- [ ] Set up file organization structure (tasks/ and tasks/completed/)

## Phase 2: Basic Task Management
- [ ] Create main task list view
  - Single column design
  - Simple completion toggle
  - Basic task display with title and priority
- [ ] Implement task completion with file movement
  - Move completed tasks to completed/ directory
- [ ] Create task detail overlay
  - Display full markdown content
  - Show metadata (dependencies, epic, priority)

## Phase 3: Task Creation & Editing
- [ ] Build task creation interface
  - Title input
  - Priority selection
  - Dependencies (as URLs)
  - Epic/parent task fields
- [ ] Implement markdown content editor
- [ ] Add file saving functionality
  - Generate proper filename
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