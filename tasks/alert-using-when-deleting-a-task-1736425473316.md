---
ref: TSK-028
title: Alert using when deleting a task
status: done
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

# Implementation Notes

Added a delete confirmation dialog using the AlertDialog component:

1. Added new state `showDeleteAlert` to control the dialog visibility
2. Modified delete button to show the alert dialog instead of deleting immediately
3. Added AlertDialog with:
   - Clear warning message about file deletion
   - Reference to git for potential recovery
   - Cancel button to abort
   - Delete button (red) to confirm
4. Only proceed with deletion after user confirms
5. Close both the alert and task dialogs after successful deletion
