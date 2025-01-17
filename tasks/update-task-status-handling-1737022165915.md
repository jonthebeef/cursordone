---
title: Update task status handling in UI
status: todo
priority: high
complexity: M
epic: ui-cleanup
dependencies:
  - implement-ui-for-new-task-fields
tags:
  - ui
  - enhancement
  - lifecycle
created: '2024-01-16'
owner: AI
---

# Update Task Status Handling in UI

The current UI only handles a simple toggle between todo/done states and doesn't properly track task lifecycle dates.

## Current Issues
1. UI only toggles between todo/done states
2. Not using `updateTask` function for status changes
3. Not tracking started_date and completion_date properly
4. No visual indication of in-progress state

## Required Changes

1. Task Card Component:
   - Update checkbox to handle three states (todo → in-progress → done)
   - Use `updateTask` instead of `completeTask`
   - Add visual indicator for in-progress state
   - Show started_date and completion_date when available

2. Status Change Logic:
   - Implement proper state cycling
   - Ensure dates are tracked correctly
   - Handle worker assignment on status changes
   - Preserve existing dates when appropriate

3. UI/UX Improvements:
   - Add tooltip showing current state
   - Show status change history
   - Add visual feedback during transitions
   - Improve accessibility

## Implementation Details

1. Update `components/ui/task-card.tsx`:
   ```tsx
   // Replace simple checkbox with tri-state control
   // Add proper status tracking
   // Use updateTask function
   // Add date display
   ```

2. Update status change handler:
   ```tsx
   const handleStatusChange = async () => {
     const nextStatus = getNextStatus(task.status)
     await updateTask(task.filename, {
       ...task,
       status: nextStatus
     })
   }
   ```

## Success Criteria
- [ ] Task status cycles correctly through all states
- [ ] started_date is set when moving to in-progress
- [ ] completion_date is set when moving to done
- [ ] Dates are cleared appropriately when moving back to todo
- [ ] UI clearly shows current state
- [ ] All state changes are persisted correctly
- [ ] Worker assignment is handled properly

## Testing Instructions
1. Create new task
2. Cycle through all states
3. Verify dates are set correctly
4. Check worker assignment
5. Verify UI updates
6. Test keyboard accessibility 
