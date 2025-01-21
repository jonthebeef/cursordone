---
ref: TSK-232
title: Give more information to the user if an epic has no tasks
status: todo
priority: medium
complexity: M
category: bug
epic: ui-cleanup
owner: user
dependencies: []
tags:
  - error-handling
  - ux
created: "2025-01-21"
---

When viewing an epic in the task list that has no tasks with that epic applied, it creates a loading state that cannot be cleared until either another epic is selected or the browser is refreshed

if a user is looking at an epic that has no tasks, it should:

- not go into a loading state
- have a message to say that no tasks have been applied to that epic

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
