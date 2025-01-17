---
ref: TSK-194
title: "BUG: Can't select the epic when in the Task Edit dialog drop down. "
status: done
priority: high
complexity: S
epic: ui-cleanup
owner: user
worker: AI
dependencies: []
tags:
  - edit task
  - day 1
  - epics
created: "2025-01-17"
started_date: "2024-01-17"
completion_date: "2024-01-17"
---

When I go to edit a task in the dialog window that appears, whenever I click the drop-down menu to change the epic, nothing happens. It seems that it won't let me change it. Please fix this, as it is essential for task editing, as some tasks might either be in the wrong epic or need to be assigned one.

## Implementation Notes

### Files Changed

| File                                                | Changes Made                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `components/ui/task-list/task-edit-dialog-test.tsx` | Added proper styling classes and fixed epic selection dropdown functionality |

### Key Changes

1. Fixed empty string value issue:

   - Changed empty string value to "none" for clearing epic selection
   - Updated value handling in onValueChange to convert "none" to undefined
   - Fixed runtime error with Select.Item validation

2. Added styling and interaction improvements:

   - Added stopPropagation to prevent click event bubbling
   - Increased z-index to 200 for proper stacking
   - Added position="popper" with sideOffset for better positioning
   - Added focus ring styles for better accessibility

3. Added styling classes to components:
   - SelectTrigger: bg-zinc-900/50, border-zinc-800, text-zinc-100
   - SelectContent: z-[200], bg-zinc-900, border-zinc-800
   - SelectItem: text-zinc-100, hover:bg-zinc-800, focus:bg-zinc-800

### Testing Completed

- Verified epic dropdown opens and closes properly
- Confirmed epic selection works without runtime errors
- Tested clearing epic selection using "None" option
- Validated visual consistency with other dropdowns
- Confirmed proper z-index stacking and positioning

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
