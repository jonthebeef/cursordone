---
ref: TSK-035
title: "BUG: Task ref IDs are not unique to the task"
status: done
priority: high
epic: ui-cleanup
dependencies: []
tags:
  - task id
  - ref
created: "2025-01-09"
owner: AI
complexity: M
---

I've just noticed that task IDs are either getting re-used, or reassigned to new tasks

Task IDs need to be unique to the task itself, and should not be re-used, otherwise we will get very confused.

Please investigate and fix

# Implementation Notes

Fixed the task reference ID uniqueness issue by:

1. Enhanced the ref counter system in `lib/ref-counter.ts`:

   - Added tracking of all used refs in the counter file
   - Created `getUsedRefs()` function to scan all tasks for their refs
   - Added `markRefAsUnused()` function to handle ref cleanup
   - Improved `getNextRef()` to ensure uniqueness:
     - Maintains list of all used refs
     - Increments counter until finding an unused ref
     - Prevents ref reuse even after task deletion

2. Updated task deletion logic in `lib/tasks.ts`:

   - Added ref cleanup when deleting tasks
   - Retrieves task ref before deletion
   - Marks the ref as unused in the counter system

3. Modified `scripts/update-task-refs.ts`:

   - Integrated with ref counter system
   - Uses `getNextRef()` for assigning new refs
   - Respects existing refs to maintain uniqueness

4. Added safeguards:
   - Counter initialization now scans existing tasks
   - Maintains highest ref number to prevent duplicates
   - Ensures refs are never reused, even if lower numbers are available
   - Handles system initialization with existing tasks

Tested and verified:

- Creating tasks through UI assigns unique refs (TSK-042, TSK-043)
- Deleting tasks and creating new ones assigns new refs (not reusing deleted ones)
- Manually created markdown files get correct refs through update script (TSK-044, TSK-045)
- Ref counter system maintains uniqueness across all creation methods

This ensures that task reference IDs remain unique throughout the system's lifetime, even when tasks are deleted and new ones are created.

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
