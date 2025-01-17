---
ref: TSK-087
title: Update task view and edit dialog layout
status: done
priority: medium
epic: ui-cleanup
complexity: M
owner: AI
tags: []
---

# Update task view and edit dialog layout

Match the new create task dialog layout and improve content display.

## Implementation Notes

- Updated task view and edit dialog layout to match the new create task dialog:
  - Increased dialog width to `max-w-4xl`
  - Implemented two-column grid layout with main content on left and metadata on right
  - Added full-width dependencies section below main content
  - Enhanced content display with proper markdown rendering in view mode
  - Added text editor with formatting controls in edit mode
  - Fixed state management to ensure task updates are immediately reflected in the UI
  - Added proper error handling and loading states
  - Improved visual hierarchy with consistent spacing and styling
  - Fixed dependencies display to properly show dependent tasks with their refs, titles, and epics
  - Added click-through navigation between dependent tasks

The task view and edit dialog now provides a more consistent and polished experience that matches the create task dialog.

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
