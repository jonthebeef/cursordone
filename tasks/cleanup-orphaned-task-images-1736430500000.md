---
ref: TSK-046
title: 'Cleanup orphaned task images'
status: todo
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
- [ ] Images are deleted when their task is deleted
- [ ] No orphaned images in public/task-images
- [ ] Cleanup operations are logged
- [ ] Error handling prevents crashes 