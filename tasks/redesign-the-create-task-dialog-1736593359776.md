---
ref: TSK-083
title: Redesign the create task dialog
status: done
priority: medium
complexity: M
epic: ui-cleanup
dependencies: []
tags:
  - redesign
  - dialog
created: '2025-01-11'
owner: AI
---
The current layout for the create task dialog is a little cramped, without enough focus on the content area which is the most important for setting context

can you make the create dialog bigger, to accommodate the layout change in the wireframe below?

you should

- keep this in a dialog not a separate page
- use the existing components
- introduce a text formatting component (for notion like formatting)



![IMG_7438.jpeg](/task-images/1736593065571-IMG_7438.jpeg)

# Implementation Notes

Redesigned the create task dialog with improved layout and functionality:

1. Enhanced Dialog Layout:
   - Increased dialog width to max-w-4xl for better content space
   - Implemented two-column grid layout (2/3 content, 1/3 metadata)
   - Added full-width dependencies section below main content
   - Improved spacing and visual hierarchy

2. Content Area Improvements:
   - Added TextEditor component with formatting tools
   - Implemented bold, italic, bullet lists, and numbered lists
   - Added image and file upload capabilities
   - Set content height to 280px for better balance

3. Metadata Organization:
   - Moved priority, complexity, epic selection to right column
   - Added tag input and epic selector
   - Maintained consistent styling with rest of UI
   - Improved visual separation between sections

4. Dependencies Section:
   - Added full-width dependencies section below main content
   - Implemented search functionality for finding tasks
   - Added checkbox selection for dependencies
   - Shows task refs and epics for better context

5. UI Refinements:
   - Consistent button and input styling
   - Improved spacing between sections
   - Clear visual hierarchy for all elements
   - Better use of available space
