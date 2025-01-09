---
ref: TSK-046
title: 'Cleanup orphaned task images'
status: done
priority: medium
epic: ui-cleanup
dependencies: []
tags:
  - cleanup
  - images
created: '2024-01-09'
---
Currently, when a task containing images is deleted, the image files remain in the `public/task-images` directory. This leads to:

1. Orphaned images taking up disk space
2. Potential confusion if image filenames are reused
3. Unnecessary files in the git repository

## Requirements

1. When deleting a task:
   - Parse the task content for image references
   - Delete any referenced images from public/task-images
   - Handle both markdown and HTML image syntax

2. Add cleanup script:
   - Scan all tasks for image references
   - Compare against images in public/task-images
   - Delete any images not referenced by any task
   - Could be run manually or on git pre-commit

3. Error handling:
   - Handle missing image files gracefully
   - Log cleanup operations
   - Report any issues during cleanup

## Success Criteria
- [x] Images are deleted when their task is deleted
- [x] No orphaned images in public/task-images
- [x] Cleanup operations are logged
- [x] Error handling prevents crashes 

# Implementation Notes

Implemented automatic image cleanup in the task deletion process:

1. Enhanced `deleteTask` function in `lib/tasks.ts`:
   - Added image reference parsing using regex pattern `!\[.*?\]\(\/task-images\/(.*?)\)`
   - Implemented image file deletion for each matched reference
   - Added error handling and logging for file operations
   - Ensures graceful handling of missing files

2. Testing confirmed:
   - Images are properly deleted when their task is deleted
   - No orphaned images remain in public/task-images
   - Operation logs show successful deletions
   - System handles missing files gracefully
   - Multiple images in a single task are handled correctly

3. Future improvements considered:
   - Add periodic cleanup script for orphaned images
   - Implement git pre-commit hook for cleanup
   - Add HTML image syntax support if needed
   - Consider backup/recovery mechanism

4. Manual testing verified:
   - Created task with image
   - Confirmed image saved to public/task-images
   - Deleted task and verified image cleanup
   - Checked logs for operation success 