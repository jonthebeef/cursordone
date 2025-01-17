---
ref: TSK-193
title: Append these guidelines when a task is created
status: done
priority: medium
complexity: M
epic: task-management
owner: user
dependencies: []
tags:
  - prompt
  - day 1
  - task creation
created: "2025-01-17"
started_date: "2025-01-17"
worker: user
completion_date: "2025-01-17"
---

When the user creates a task in the web app, we need to append some extra notes to the task without showing the user these notes.

upon hitting "create task", the following notes should be added to the task markdown file:

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis

# Implementation Notes

Successfully implemented the automatic guidelines appending feature:

1. Modified task creation in `components/ui/task-list.tsx`:

   - Added guidelines constant with motivational points
   - Appended guidelines to task content during save
   - Guidelines are added after user content but before saving
   - Not visible in creation dialog UI

2. Verified functionality:

   - Guidelines appear in all newly created tasks
   - Format is consistent with markdown structure
   - User content remains unaffected
   - Guidelines persist in task files

3. Testing confirmed:
   - Guidelines appear in web UI created tasks
   - Format is preserved in markdown files
   - No interference with task editing
   - Clean separation between user content and guidelines
