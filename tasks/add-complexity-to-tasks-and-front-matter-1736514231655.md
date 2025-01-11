---
ref: TSK-058
title: Add complexity to tasks and front matter
status: done
priority: medium
epic: task-management-enhancement
dependencies: []
tags:
  - complexity
created: '2025-01-10'
---
When adding or review a task, a user might want to add a complexity score in the form of "t-shirt" size. This would enable greater understanding and prioritisation of tasks. 

enable a feature in create and edit task, which is reflected in the markdown front matter, which enables the user to select from a drop down the complexity

XS
S
M
L
XL

# Implementation Notes

Added complexity field to tasks with T-shirt sizing:

1. Data Layer:
   - Added `complexity` field to Task and TaskFrontmatter interfaces
   - Values: XS, S, M, L, XL
   - Made field optional for backward compatibility

2. UI Components:
   - Added complexity selector to task creation dialog
   - Added complexity selector to task edit dialog
   - Default value set to 'M' for new tasks
   - Used consistent button-based selector style matching priority selector

3. Task Display:
   - Added complexity to task card metadata
   - Used purple indicator dot for visual distinction
   - Added complexity to task view dialog metadata
   - Maintained consistent styling with other metadata

4. State Management:
   - Updated task state initialization
   - Added complexity to task reset state
   - Preserved complexity in task updates

The feature is now complete and working as expected, providing users with a clear way to indicate task complexity using T-shirt sizes.
