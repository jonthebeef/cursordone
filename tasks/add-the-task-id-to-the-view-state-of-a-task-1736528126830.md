---
ref: TSK-059
title: Add the task id to the view state of a task
status: done
priority: medium
epic: ui-cleanup
dependencies: []
tags:
  - task ref
created: '2025-01-10'
owner: AI
complexity: M
---
When I open a task from the task list, it only shows the title of the task, with no mention of the task ref. The task ref has become a primary way of us communicating about tasks

can you add the task ref to the view state of a task please?

# Implementation Notes

Added task ref to the task view dialog:

1. Added ref display above task title in view mode
2. Styling:
   - Used monospace font (font-mono) for consistency with other ref displays
   - Subtle gray color (text-zinc-400) to maintain visual hierarchy
   - Proper spacing with margin-bottom
3. Made ref display conditional on ref existence
4. Maintained existing layout and styling of the dialog
5. Kept accessibility with screen reader support
