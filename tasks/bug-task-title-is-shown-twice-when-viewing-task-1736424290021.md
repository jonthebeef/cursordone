---
ref: TSK-080
title: 'BUG: Task title is shown twice when viewing task'
status: done
priority: high
epic: ui-cleanup
dependencies: []
tags:
  - ui
  - view task
created: '2025-01-09'
---
When viewing a task, the task title is shown twice. remove the smaller title so the larger one remains.
![Screenshot 2025-01-09 at 12.05.18.png](/task-images/1736424330655-Screenshot-2025-01-09-at-12.05.18.png)

# Implementation Notes

Fixed the duplicate title issue while maintaining accessibility:

1. Removed visible DialogTitle from DialogHeader
2. Added visually hidden DialogTitle (sr-only) for screen reader accessibility:
   - "Edit Task" in edit mode
   - "View Task: [task title]" in view mode
3. Kept the larger title in the dialog content for visual display
4. Made title content dynamic based on edit/view mode
5. Ensured compliance with Radix UI Dialog accessibility requirements
