---
title: "BUG: Owner not showing email in front matter"
status: todo
priority: high
complexity: S
epic: ui-cleanup
dependencies: []
tags:
  - bug
  - front matter
  - owner
created: "2024-01-16"
owner: AI
ref: TSK-190
---

# Owner Not Showing Email in Front Matter

Despite updating the task creation dialog to use the authenticated user's email for the owner field, tasks are still being created with `owner: user` in the front matter.

## Current Behavior

- Tasks created in web UI show `owner: user`
- Worker field correctly shows email when task moves to in-progress
- Changes to task creation dialog aren't taking effect

## Expected Behavior

- Tasks created in web UI should show `owner: email@address.com`
- Only tasks created via markdown should show `owner: AI`

## Investigation Points

1. Check if auth state is available during task creation
2. Verify data flow from client through server action to task creation
3. Check if owner field is being overwritten somewhere
4. Review logging to see where the value changes

## Success Criteria

- [ ] Tasks created in web UI show the authenticated user's email as owner
- [ ] Tasks created via markdown show "AI" as owner
- [ ] Existing task owner values are preserved during updates

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
