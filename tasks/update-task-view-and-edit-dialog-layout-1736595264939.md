---
ref: TSK-087
title: Update task view and edit dialog layout
status: done
priority: medium
epic: ui-cleanup
complexity: M
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

The task view and edit dialog now provides a more consistent and polished experience that matches the create task dialog.
