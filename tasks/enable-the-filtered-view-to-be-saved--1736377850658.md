---
ref: TSK-019
title: 'Enable the filtered view to be saved '
status: done
priority: high
epic: ui-cleanup
dependencies: []
tags:
  - filters
  - 10 jan
created: '2025-01-08'
---
When refreshing the browser, the filtered view we have is lost. Can a cookie or local storage method be implemented so the last filtered state of the task list is remembered?

## Implementation Notes

- Added localStorage persistence in `TasksWrapper` component
- Two useEffect hooks handle the persistence:
  1. Load saved filters on component mount
  2. Save filters whenever they change
- Data structure saved in localStorage:
  ```typescript
  {
    epic: string | null,    // Selected epic ID
    tags: string[]          // Array of selected tag names
  }
  ```
- Key used: 'taskFilters'
- Persistence is permanent until user clears browser data or explicitly resets filters
- No expiration mechanism needed for current use case
