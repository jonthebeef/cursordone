---
ref: TSK-015
title: Remove space above task page heading and create task button
status: done
priority: medium
epic: ui-cleanup
dependencies: []
tags:
  - ui
created: '2025-01-08'
---
There is too much space above the heading on the task list screen. Lets remove this to pull the heading and button top aligned with the app name in the sidebar

Can you also fix the search and create task button in a fixed area at the top of the task view so these features are always accessible to the user no matter how far they've scrolled down the tasks.

# Implementation Notes

1. Removed extra spacing above the task list header by updating the layout structure
2. Made the search and create task buttons sticky at the top of the page:
   - Added `sticky top-0` positioning
   - Added semi-transparent background with blur effect (`bg-zinc-950/80 backdrop-blur-sm`)
   - Set z-index to ensure it stays above other content
3. Maintained proper spacing between the sticky header and content below
4. Ensured the search and create task buttons remain accessible while scrolling
5. Further adjustments made:
   - Reduced margin between task list and navigation (from mt-6 to mt-2)
   - Attempted to fix Create Task button responsive margin
   - Created bug ticket TSK-050 to track remaining button margin issue
