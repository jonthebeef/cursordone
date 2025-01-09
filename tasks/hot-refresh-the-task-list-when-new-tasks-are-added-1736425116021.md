---
ref: TSK-027
title: Hot refresh the task list when new tasks are added
status: done
priority: medium
epic: ui-cleanup
dependencies: []
tags:
  - refresh
  - task list
created: '2025-01-09'
---
Currently, I need to refresh the page to see new tasks that have been added.

The system should hot refresh (maybe with a toast) to tell the user new tasks have been added to the task list

# Implementation Notes

Added automatic task list refresh functionality:

1. Implemented 5-second interval refresh using Next.js router.refresh()
2. Added smart task detection:
   - Detects new tasks by comparing filenames
   - Detects removed tasks
   - Detects changes in task properties (status, title, priority, epic, tags)
   - Only updates UI when changes are detected
3. Added toast notifications:
   - Shows 🔄 notification when new tasks are added
   - Shows 🔄 notification when tasks are modified
   - Clean, non-intrusive UI feedback
4. Optimized performance:
   - Uses React useTransition for smooth updates
   - Prevents unnecessary re-renders
   - Cleans up interval on component unmount
