---
ref: TSK-034
title: 'BUG: The delete task alert only shows in responsive layout'
status: todo
priority: high
epic: ui-cleanup
dependencies:
  - alert-using-when-deleting-a-task-1736425473316.md
tags:
  - delete task
  - dialog
  - responsive
created: '2025-01-09'
---
When the task list is in responsive mode and the side bar is hidden in the burger action, the delete alert shows fine. When the task list is in "desktop" mode with the sidebar showing, it doesn't show the delete alert UI at all, and just deletes the file.
