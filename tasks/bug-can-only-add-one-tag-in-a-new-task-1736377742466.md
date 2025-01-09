---
ref: TSK-018
title: 'BUG: Can only add one tag in a new task in web'
status: done
priority: high
epic: ui-cleanup
dependencies: []
tags:
  - tagging-problem
created: '2024-01-09'
---

I cannot add multiple tags to a task, the field won't let me. I need to be able to add multiple tags to a task in comma separated fashion.

# Implementation Notes

Fixed the tag input functionality across all dialogs (create task, edit task, create epic, edit epic) by:

1. Simplified the tag input handling to use a single string state variable for each dialog
2. Only convert comma-separated string to array when saving
3. Convert array back to comma-separated string when loading for editing
4. Specific changes:
   - Task List: Added `editTagInput` state for edit dialog
   - Epic List: Added `newTagInput` and `editTagInput` states
   - Both components now handle tag conversion only at save/load points
   - Removed the complex state updates that were trying to maintain array format

This approach is more straightforward and matches how users naturally input tags (typing with commas).
