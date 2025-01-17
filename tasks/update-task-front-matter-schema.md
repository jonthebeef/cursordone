---
ref: TSK-145
title: Update task front matter schema
status: done
priority: high
complexity: M
epic: task-management
owner: AI
dependencies: []
tags:
  - schema
  - front-matter
  - day 1
created: "2024-01-15"
started_date: "2024-01-17"
completion_date: "2024-01-17"
worker: user
---

# Update Task Front Matter Schema

Update the front matter schema to include new fields for better task tracking and RAG capabilities.

## Implementation Notes

### Files Changed

| File                          | Changes Made                                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/tasks.ts`                | Added new fields to Task and TaskFrontmatter interfaces: worker, started_date, completion_date. Updated updateTaskStatus function to handle status transitions and tracking fields. |
| `components/ui/task-card.tsx` | Modified handleStatusChange to implement proper status flow (todo -> in-progress -> done) and use updateTaskStatusAction directly.                                                  |
| `components/task-list.tsx`    | Removed handleStatusChange and simplified component hierarchy by using direct server action calls.                                                                                  |

### Key Changes

1. Task Schema Updates:

   - Added `worker` field to track who is working on the task
   - Added `started_date` field, auto-set when task moves to in-progress
   - Added `completion_date` field, auto-set when task moves to done
   - All tracking fields are cleared when task moves back to todo

2. Status Transition Logic:

   - Todo -> In Progress: Sets started_date and worker
   - In Progress -> Done: Sets completion_date while preserving worker and started_date
   - Done -> Todo: Clears all tracking fields
   - In Progress -> Todo: Clears all tracking fields

3. Front Matter Handling:
   - Added proper serialization of undefined values
   - Ensured YAML compatibility
   - Maintained existing field values during updates

### Testing Completed

- Verified full status cycle (todo -> in-progress -> done -> todo)
- Confirmed proper date tracking in front matter
- Tested edge cases (quick status changes, undefined fields)
- Validated front matter integrity during transitions

## Success Criteria

- [x] New fields added to schema
- [x] Documentation updated
- [x] Migration script created and tested
- [x] Existing tasks remain compatible

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
