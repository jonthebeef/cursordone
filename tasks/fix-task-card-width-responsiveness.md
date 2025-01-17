---
title: Fix task card width responsiveness
status: todo
priority: high
complexity: M
epic: ui-cleanup
dependencies: []
tags:
  - ui
  - responsive
  - bug
created: "2024-01-15"
ref: TSK-169
owner: AI
---

# Problem

The task card width control is currently scattered across multiple components, leading to conflicting width constraints. This has resulted in cards stretching to full width and breaking the layout.

# Core Solution

We need to centralize width control to a single constraint at the root level (`task-list.tsx`), removing all other width-related styles from child components. This will:

1. Eliminate conflicting width controls
2. Ensure consistent card widths
3. Fix the broken layout

# Current Architecture Understanding

The width control is currently fragmented across:

1. Root Layout (`components/ui/task-list.tsx`):

   - Has its own width constraints
   - Contains fixed header with search/sort

2. Task Card Components:

   - `components/ui/task-card.tsx`: Has width styles
   - `components/ui/sortable-task-card.tsx`: Adds more width constraints
   - Card component: Has its own width classes

3. Container Components:
   - `components/ui/task-list/task-list-container.tsx`: Adds width styles
   - Each section adds its own width classes

# Implementation Details

1. Remove All Existing Width Controls:

   ```tsx
   // Remove from sortable-task-card.tsx
   - width: '100%' from style object
   - w-full from className

   // Remove from task-card.tsx
   - w-full and any width classes

   // Remove from task-list-container.tsx
   - width related classes from container div
   ```

2. Add Single Source of Width Control:

   ```tsx
   // In task-list.tsx only
   <main className={cn(
     "flex-1 overflow-auto px-2",
     "w-[90%] lg:w-[80%] mx-auto", // Single source of width control
     selectedEpic || selectedTags.length > 0 ? "pt-0" : "pt-[52px]"
   )}>
   ```

3. Clean Up Related Styles:
   - Remove any max-width constraints
   - Remove redundant margin/width utilities
   - Keep only padding/spacing utilities

# Success Criteria

- [ ] Single width constraint in task-list.tsx:

  - 80% width on desktop (>1024px)
  - 90% width on mobile (<1024px)
  - No width controls anywhere else

- [ ] Clean Component Structure:

  - Task cards inherit width from parent
  - No width-related props passed down
  - No inline width styles

- [ ] Layout Integrity:
  - Cards align perfectly with header
  - No horizontal scrolling
  - Proper spacing preserved

# Testing Checklist

- [ ] Verify single constraint works:

  - Desktop view (>1024px)
  - Mobile view (<1024px)
  - Tablet view
  - With/without sidebar

- [ ] Validate cleanup:

  - No width styles in child components
  - No max-width constraints
  - No conflicting classes

- [ ] Check functionality:
  - Drag and drop works
  - Card selection works
  - All interactions preserved

# Notes

- This is a cleanup task - we're removing complexity, not adding it
- The goal is a single source of truth for width control
- Document the central width control for future reference

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
