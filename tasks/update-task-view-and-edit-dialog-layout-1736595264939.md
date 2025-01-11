---
title: Update task view and edit dialog layout
status: todo
priority: medium
complexity: M
epic: ui-cleanup
dependencies: []
tags:
  - redesign
  - dialog
created: '2025-01-11'
---
The task view and edit dialog need to be updated to match the new create task dialog layout. The content should be rendered as HTML in view mode and only show markdown in edit mode.

Requirements:
- Update view dialog to match create dialog layout
  - Two-column layout with content on left
  - Metadata on right
  - Dependencies section below
- Render markdown content as HTML in view mode
  - Use existing ReactMarkdown component
  - Keep current styling for rendered content
- Show markdown editor only in edit mode
  - Use TextEditor component with formatting tools
  - Maintain file upload capabilities
- Preserve delete functionality
  - Keep delete button in view mode
  - Ensure alert dialog works as before
- Maintain consistent styling
  - Use same spacing and grid layout as create dialog
  - Keep consistent button and input styling 