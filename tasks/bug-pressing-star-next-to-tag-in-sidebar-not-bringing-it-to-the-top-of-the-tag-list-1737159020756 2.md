---
ref: TSK-208
title: >-
  BUG: Pressing star next to tag in sidebar not bringing it to the top of the
  tag list
status: done
priority: high
complexity: S
epic: launch-mvp
owner: user
worker: AI
started_date: "2024-03-20"
completion_date: "2024-03-20"
dependencies:
  - enable-tag-starring-for-improved-organization-1736513810527
tags:
  - tags
  - star
  - bug-fix
created: "2025-01-18"
---

# BUG: Pressing star next to tag in sidebar not bringing it to the top of the tag list

Fixed the issue where starring a tag wasn't correctly saving the starred state to the server, resulting in the tag not appearing at the top of the tag list after page refresh.

## Implementation Notes

1. Identified the root cause of the issue:

   - The `handleStarClick` function in `side-nav.tsx` was sending requests to the API with an incomplete payload
   - It was missing the required `action` parameter that the API route expected
   - This caused the API to reject the requests with a 400 error

2. Fixed the problem by:

   - Updating the `handleStarClick` function to use the POST method with an appropriate `action` parameter
   - Changed from using DELETE/POST methods to using a single POST method with action="star" or action="unstar"
   - This ensures the API correctly processes the request and updates the starred tags list

3. Also fixed an unrelated issue:
   - Updated the `ProfileButton` component usage to not pass an email prop
   - The component had been updated to get user data from hooks instead of props

| File                         | Changes Made                                         |
| ---------------------------- | ---------------------------------------------------- |
| `components/ui/side-nav.tsx` | Fixed tag starring API calls and ProfileButton usage |

## Success Criteria

- [x] Clicking star immediately moves tag to top of list
- [x] Starred state persists after page refresh
- [x] Visual indication (yellow star) shows correctly
- [x] No console errors when starring/unstarring tags

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
