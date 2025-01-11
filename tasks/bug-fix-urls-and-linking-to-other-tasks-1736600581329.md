---
ref: TSK-088
title: 'BUG: Fix URLs and linking to other tasks'
status: todo
priority: high
complexity: L
epic: ui-cleanup
dependencies: []
tags:
  - links
created: '2025-01-11'
---
The system can't handle clicking links to other tasks or epics.

Right now, when I click a related task (either on a task, or within an epic), the page reloads on the all tasks view.

When a user clicks a related task, it should open the dialog, so that it can be viewed, or closed and returned to the task it was clicked from.

We need an elegant solution for this. I don't think that opening a dialog on top of a dialog is right.

We need to get the behaviour right here

Before you code, discuss the options we have so we can get to the right thing. We don't need to build the world's best project management tool, just a feature that makes sense to the user and is simple to implement.

Feel free to also discussing breaking this into smaller tasks if appropriate. And if you're tackling this in its entirety, advise me to add this as context to the composer, and add a checklist of activity to this task that you constantly tick off as items are completed.

remember to test before marking as done and committing to git. 
