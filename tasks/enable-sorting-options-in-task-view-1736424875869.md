---
ref: TSK-076
title: Enable sorting options in task view
status: done
priority: medium
epic: ui-cleanup
dependencies: []
tags:
  - sorting
  - priority
created: '2025-01-09'
---
When viewing the tasks, it maybe be preferential to sort all by

- date added
- priority level

Please enable. Suggest UI to implement before you start code. 

## Implementation Notes

✅ Successfully implemented task sorting options with the following features:

1. Sort Options UI:
   - Added a sort dropdown in the header next to search bar
   - Clean and intuitive interface with sort icon
   - Seamlessly integrates with existing UI

2. Sorting Methods:
   - Manual Order (default, drag-and-drop)
   - Date Added (newest first)
   - Date Added (oldest first)
   - Priority (high to low)
   - Priority (low to high)

3. Technical Implementation:
   - Used React's useMemo for efficient sorting
   - Maintains manual order when using drag-and-drop
   - Smooth transitions between sort options
   - Preserves task status sections (backlog/done)

The feature is now complete and working as expected, providing users with flexible ways to organize their tasks. 
