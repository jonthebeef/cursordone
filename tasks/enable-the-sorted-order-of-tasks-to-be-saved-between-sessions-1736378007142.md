---
ref: TSK-020
title: Enable the sorted order of tasks to be saved between sessions
status: done
priority: high
epic: ui-cleanup
dependencies:
  - enable-the-filtered-view-to-be-saved--1736377850658.md
tags:
  - 10 jan
created: '2025-01-08'
---
When tasks have been prioritised through drag and drop, the priority order is lost if the session is refreshed. Please enable the prioritised state of the tasks to be concrete, so that work is not lost between sessions.

## Implementation Notes

✅ Successfully implemented task order persistence with the following features:

1. Task Order Storage:
   - Implemented JSON-based storage for task orders
   - Handles both global and filtered views (epics/tags)
   - Orders are saved in `task-orders.json`

2. Drag and Drop:
   - Working drag and drop functionality in both views
   - Real-time UI updates with optimistic rendering
   - Fallback handling for failed saves

3. Order Persistence:
   - Global order persistence works
   - Epic-specific order persistence works
   - Combined epic and tag filter persistence works
   - Orders are maintained between page refreshes

4. API Implementation:
   - Added `/api/task-order` endpoint for loading saved orders
   - Implemented server actions for saving orders
   - Added error handling and fallbacks

The feature is now complete and working as expected, with all edge cases handled and proper persistence across sessions.
