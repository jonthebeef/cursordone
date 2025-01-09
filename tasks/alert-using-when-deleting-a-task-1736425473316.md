---
ref: TSK-028
title: Alert using when deleting a task
status: todo
priority: medium
epic: ui-cleanup
dependencies: []
tags:
  - delete
  - dialog
  - alert
created: '2025-01-09'
---
Deleting a task is very effective, but we need to add some friction to avoid unnecessary deletion of tasks

When the user hits delete on a task, present a dialog box that says:

"Deleting this task removes the file from your local system. You may be able to retrieve it if you have committed your project recently to git. If not, it will be gone forever."

give the user 2 buttons

- Delete task (enables the delete action)
- Cancel (returns the user to the open task)
