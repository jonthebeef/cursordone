---
ref: TSK-077
title: "BUG: Fix the epic front matter"
status: done
priority: high
epic: ui-cleanup
dependencies: []
tags:
  - front-matter
created: "2025-01-08"
owner: AI
complexity: M
---

Currently, the system is sending to front matter the correct epics, meaning that unless the front matter is changed in the md file, it won't show under it's intended epic in web

the system is not

- changing the epic title to lower case
- replacing spaces with hyphens

plz fix

# Implementation Notes

Fixed the epic front matter issue by:

1. Modified task creation and update logic in `lib/tasks.ts`:

   - Added formatting for epic field in both `createTask` and `updateTask` functions
   - Epic titles are now automatically:
     - Converted to lowercase
     - Have spaces and special characters replaced with hyphens
   - Added null check with optional chaining for epic field
   - Undefined epics are properly handled and removed from front matter

2. Testing confirmed:
   - New tasks are created with correctly formatted epic IDs
   - Existing tasks maintain proper epic formatting when edited
   - Tasks now correctly appear under their respective epics in the web UI

This ensures consistent epic references across the application and fixes the issue where tasks weren't showing up under their intended epics.

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
