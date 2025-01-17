---
title: Fix dependencies lookup in task view dialog
status: done
priority: high
complexity: S
epic: ui-cleanup
dependencies:
  - create-cursor-rules-for-ai
tags:
  - bug
  - ui
  - dependencies
created: "2024-01-15"
ref: TSK-154
owner: AI
---

# Fix Dependencies Lookup in Task View Dialog

Currently, dependencies are not showing in the task view dialog because the UI is looking up tasks by ref instead of filename.

## Implementation Details

1. Update task lookup in `components/ui/task-list.tsx`:

   - Change dependency lookup to use filename instead of ref
   - Keep the same UI display with ref, title, and epic
   - Ensure proper error handling for missing tasks

2. Code Changes Required:

   ```typescript
   // Change from:
   const task = initialTasks.find((t) => t.ref === ref);

   // To:
   const task = initialTasks.find((t) => t.filename === `${dep}.md`);
   ```

3. UI Improvements:
   - Add loading state for dependency lookup
   - Show error state for missing dependencies
   - Maintain clickable links to dependent tasks

## Implementation Notes

| File                          | Changes Made                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `components/ui/task-list.tsx` | Updated dependency lookup to use filenames instead of refs and added error handling for missing dependencies |

Progress:

- Changed dependency lookup to use filenames
- Added error state UI for missing dependencies
- Maintained existing UI for valid dependencies
- Added clear error messaging
- Kept clickable navigation working

## Success Criteria

- [x] Dependencies are correctly displayed in task view dialog
- [x] Clicking dependency links navigates to correct task
- [x] Error states handled gracefully
- [x] No regressions in task view functionality

## Technical Considerations

- Need to handle cases where .md extension might be included
- Consider caching task lookup for performance
- Maintain existing UI layout and styling

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
