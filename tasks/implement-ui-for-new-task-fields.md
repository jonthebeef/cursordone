---
title: Implement UI for new task fields
status: todo
priority: high
complexity: M
epic: ui-cleanup
dependencies:
  - update-task-front-matter-schema
tags:
  - ui
  - enhancement
  - day 1
created: '2024-01-15'
ref: TSK-170
owner: AI
---

# Implement UI for New Task Fields

Now that we've updated the task schema with new fields, we need to implement the UI and front matter logic to support these fields.

## Required Changes

1. Front Matter Logic:
   - Update `lib/tasks.ts` to handle new fields in createTask/updateTask
   - Add validation for date formats
   - Implement completion_date setting when status changes to done
   - Add type safety for new fields
   - Update task parsing/serialization
   - Implement ownership and worker tracking:
     - Add `owner` field (who wrote the task)
     - Add `worker` field (who is delivering the task)
     - Set owner to "AI" for tasks created via markdown files
     - Set owner to logged-in user for tasks created in web UI
     - Set worker to "AI" when AI picks up a task
     - Set worker to logged-in user when they pick up a task

2. Task Creation Dialog:
   - Add due date picker
   - Add owner field (auto-set, read-only)
   - Add worker field (editable)
   - Add comments text area
   - Update validation
   - Connect to front matter logic

3. Task Edit Dialog:
   - Add due date picker
   - Show owner field (read-only)
   - Add/edit worker field
   - Add comments text area
   - Show completion date (read-only if status is done)
   - Update validation
   - Connect to front matter logic

4. Task View Dialog:
   - Display all new fields
   - Format dates appropriately
   - Show owner and worker clearly
   - Show/hide fields based on availability

5. Task Card:
   - Add visual indicators for due date
   - Show owner and worker indicators
   - Indicate if task has comments

## Component Updates Required

1. `lib/tasks.ts`:
   - Update TaskFrontMatter interface with owner and worker
   - Enhance createTask function to set owner based on creation method
   - Enhance updateTask function to handle worker assignment
   - Add date validation utilities
   - Add completion date logic
   - Add ownership validation rules

2. `.cursorrules`:
   - Add rules for setting owner to "AI" for markdown-created tasks
   - Add rules for worker assignment when AI picks up tasks

3. `components/ui/task-list/task-creation-dialog.tsx`:
   - Add new form fields
   - Update form state
   - Add validation
   - Connect to enhanced createTask
   - Auto-set owner based on creation context

4. `components/ui/task-list/task-edit-dialog.tsx`:
   - Add new form fields
   - Update form state
   - Handle completion date logic
   - Connect to enhanced updateTask
   - Handle worker assignment

5. `components/ui/task-list/task-view-dialog.tsx`:
   - Add new field display
   - Format dates
   - Handle empty states
   - Display owner/worker information

6. `components/ui/task-card.tsx`:
   - Add new visual elements
   - Update layout
   - Handle empty states
   - Show owner/worker indicators

## Success Criteria

- [ ] Front matter logic properly handles all new fields
- [ ] Completion date is automatically set when status -> done
- [ ] Owner is correctly set based on creation context (AI vs Web UI)
- [ ] Worker can be assigned and updated
- [ ] All new fields can be set during task creation
- [ ] All new fields can be edited in existing tasks
- [ ] Fields are properly displayed in task view
- [ ] Task cards show relevant indicators
- [ ] Dates are properly formatted
- [ ] Empty states are handled gracefully
- [ ] All changes are responsive
- [ ] Validation works correctly

## Testing Checklist

- [ ] Test front matter logic:
  - Create task with new fields
  - Update task with new fields
  - Verify completion date on status change
  - Test date validation
  - Test empty/undefined fields
  - Test owner assignment in different contexts
  - Test worker assignment scenarios

- [ ] Test ownership rules:
  - Create task via markdown (owner should be AI)
  - Create task via web UI (owner should be logged-in user)
  - AI picks up task (worker should be AI)
  - User picks up task (worker should be logged-in user)

- [ ] Test UI components:
  - Create new task with all fields
  - Edit existing task to add new fields
  - View task with all fields populated
  - View task with empty fields
  - Check date formatting
  - Verify completion date logic
  - Test responsive layout
  - Validate form submissions
  - Verify owner/worker display 
