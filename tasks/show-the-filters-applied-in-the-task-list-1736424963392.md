---
ref: TSK-026
title: Show the filters applied in the task list
status: todo
priority: low
epic: ui-cleanup
dependencies:
  - enable-sorting-options-in-task-view-1736424875869.md
tags:
  - filters
created: '2025-01-09'
---
When the task list is filtered by epics and/or tags, please show the tags at the top of the screen next to backlog title so the user can clearly see what has been applied.

# Implementation Attempts & Findings

We attempted several approaches to implement this feature but encountered persistent visibility issues:

1. Initial Implementation:
   - Added filter indicators in TaskList component next to backlog title
   - Implemented proper prop passing through component chain
   - Added debug logging to verify data flow

2. Component Structure Attempts:
   - Placed indicators inside AccordionTrigger
   - Moved indicators outside AccordionTrigger
   - Tried different positioning approaches

3. CSS/Visibility Attempts:
   - Added z-index (50) to ensure visibility
   - Added position: relative
   - Added background color for contrast
   - Adjusted padding and margins

4. Debug Findings:
   - Props are correctly passed (verified through console logs)
   - Filter state is working (tasks are filtered correctly)
   - UI elements are present in DOM but not visible

The feature has been marked as low priority for now. When revisiting, consider:
1. Rebuilding the filter indicators as a separate component
2. Exploring alternative UI patterns for showing active filters
3. Investigating potential layout/structural issues in the component hierarchy
