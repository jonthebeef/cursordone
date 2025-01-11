---
title: System Architecture
description: Comprehensive documentation of the system architecture and components
created: '2024-01-11'
type: architecture
tags:
  - documentation
  - architecture
  - system
---

# System Architecture

This document provides a comprehensive overview of the system architecture, including directory structure, component relationships, file naming conventions, and data schemas.

## Directory Structure

```
cursordone/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   └── page.tsx           # Main app page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── [component].tsx   # Feature-specific components
├── docs/                 # Documentation files
│   └── *.md              # Markdown documentation
├── epics/                # Epic markdown files
│   └── *.md              # Epic definitions
├── lib/                  # Core library code
│   ├── actions.ts        # Server actions
│   ├── tasks.ts         # Task management
│   └── utils.ts         # Utility functions
├── public/              # Static assets
├── scripts/             # Utility scripts
│   └── *.ts             # Task management scripts
├── tasks/               # Task markdown files
│   └── *.md             # Individual tasks
└── package.json         # Project configuration
```

## Component Relationships

### Core Components

1. **Task Management**
   - `lib/tasks.ts`: Core task management functions
   - `lib/actions.ts`: Server actions for task operations
   - `components/ui/task-list.tsx`: Task list UI component
   - `components/ui/task-card.tsx`: Individual task display
   - `components/ui/text-editor.tsx`: Markdown editor for tasks

2. **Epic Management**
   - `lib/epics.ts`: Epic management functions
   - `components/ui/epic-list.tsx`: Epic list UI component
   - `components/ui/epic-card.tsx`: Individual epic display

3. **UI Components**
   - `components/ui/select.tsx`: Reusable select component
   - `components/ui/dialog.tsx`: Modal dialog component
   - `components/ui/button.tsx`: Button component
   - `components/ui/input.tsx`: Input component

### Data Flow

1. **Task Creation Flow**
   ```
   User Input → Task Dialog → Server Action → File System → UI Update
   ```

2. **Task Update Flow**
   ```
   Task Edit → Server Action → File System → UI Refresh → State Update
   ```

3. **Epic Management Flow**
   ```
   Epic Creation → Task Association → Progress Tracking → UI Update
   ```

## File Naming Conventions

1. **Tasks**
   - Format: `{description}-{timestamp}.md`
   - Example: `implement-task-archiving-1234567890.md`
   - Timestamp ensures uniqueness
   - Description in kebab-case

2. **Epics**
   - Format: `{epic-name}.md`
   - Example: `task-management.md`
   - Simple, descriptive names
   - Kebab-case format

3. **Components**
   - Format: `{component-name}.tsx`
   - Example: `task-card.tsx`
   - Descriptive, feature-based names
   - Kebab-case for files

4. **Documentation**
   - Format: `{doc-type}-{subject}.md`
   - Example: `system-architecture.md`
   - Clear, descriptive names
   - Kebab-case format

## Front Matter Schema

### Tasks
```yaml
---
title: string           # Task title
status: todo | done    # Task status
priority: low | medium | high  # Task priority
complexity: XS | S | M | L | XL  # Task complexity
epic: string          # Associated epic
dependencies: string[]  # List of dependent task filenames
tags: string[]        # List of tags
created: string       # Creation timestamp
ref: string          # Task reference (TSK-XXX)
---
```

### Epics
```yaml
---
title: string         # Epic title
description: string   # Epic description
status: pending | active | completed  # Epic status
priority: low | medium | high  # Epic priority
tags: string[]      # List of tags
created: string     # Creation timestamp
---
```

### Documentation
```yaml
---
title: string       # Document title
description: string # Document description
created: string     # Creation timestamp
type: string       # Document type
tags: string[]     # List of tags
---
```

## System Features

1. **Task Management**
   - Task creation and editing
   - Status tracking
   - Priority management
   - Complexity estimation
   - Dependencies tracking
   - Task archiving

2. **Epic Organization**
   - Epic creation and management
   - Task grouping
   - Progress tracking
   - Priority management

3. **UI Features**
   - Markdown editing
   - Real-time updates
   - Responsive design
   - Drag-and-drop ordering
   - Search and filtering

4. **Data Management**
   - File-based storage
   - Front matter validation
   - Reference management
   - State synchronization

## Implementation Notes

1. **File System**
   - Uses markdown files for content storage
   - Front matter for metadata
   - File-based relationships
   - Timestamp-based uniqueness

2. **State Management**
   - Server actions for updates
   - Real-time UI refresh
   - Optimistic updates
   - Error handling

3. **UI/UX**
   - Consistent component design
   - Responsive layouts
   - Intuitive navigation
   - Clear feedback

4. **Performance**
   - Efficient file operations
   - Optimized state updates
   - Lazy loading
   - Caching strategies 