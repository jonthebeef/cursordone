---
ref: TSK-017
title: 'BUG: Reinstate the add images button in create task'
status: done
priority: high
epic: ui-cleanup
dependencies: []
tags:
  - images
created: '2025-01-08'
---
We had a "add image" button which would enable

- upload an image from local machine
- Thumbnail appear in card 
- saves the image in public/task-images

It's still available in edit mode, we need it in create mode too

Please put it back

# Implementation Notes

Reinstated the image upload functionality in the create task dialog:

1. Added image upload button to create task form:
   - Reused existing image upload UI from edit mode
   - Added button with ImagePlus icon
   - Positioned under content textarea

2. Implemented upload functionality:
   - Added file input with image type restriction
   - Generates safe filename with timestamp
   - Uploads to /public/task-images directory
   - Adds markdown image syntax to content

3. Maintained consistency:
   - Used same styling as edit mode
   - Ensures consistent behavior between create and edit
   - Preserves all image handling functionality

4. Features working:
   - Local image upload
   - Safe filename generation
   - Automatic markdown insertion
   - Preview in task card after creation
