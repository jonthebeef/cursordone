---
ref: TSK-048
title: >-
  BUG: When viewing the task, the dialog is too tall, and I cannot scroll to see
  all of the content
status: done
priority: high
epic: ui-cleanup
dependencies: []
tags:
  - dialog
created: "2025-01-09"
owner: AI
complexity: M
---

I can't scroll to see all of the task

![Screenshot 2025-01-09 at 13.43.45.png](/task-images/1736430233601-Screenshot-2025-01-09-at-13.43.45.png)

# Implementation Notes

Fixed the dialog height and scrolling issues:

1. Added `max-h-[90vh]` to limit dialog height to 90% of viewport height
2. Added `overflow-y-auto` to enable scrolling when content exceeds height
3. Applied changes to `DialogContent` component in task view
4. Tested to ensure all content is accessible via scrolling
5. Maintained dialog width and other styling

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
