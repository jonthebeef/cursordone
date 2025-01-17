---
ref: TSK-027
title: "BUG: Align all epics in the sidebar to the left"
status: done
priority: medium
epic: ui-cleanup
dependencies: []
tags:
  - ui
created: "2024-01-08"
owner: AI
complexity: M
---

We have an instance of there being an epic which is centre aligned in the sidebar, while the others are left aligned. Please force the UI to always have the epics left aligned in the sidebar.

![Screenshot 2025-01-09 at 16.43.37.png](/task-images/1736441032817-Screenshot-2025-01-09-at-16.43.37.png)

# Implementation Notes

Fixed the epic alignment issue in the sidebar:

1. Modified epic button styling in `components/ui/side-nav.tsx`:

   - Added `text-left` class to ensure consistent left alignment
   - Added `whitespace-normal` to allow text to wrap naturally on multiple lines
   - Removed unnecessary transition effect
   - Maintained `justify-start` for button content alignment

2. The issue was caused by:

   - Default button text alignment behavior
   - Long epic titles wrapping incorrectly
   - Missing explicit text alignment properties

3. Changes ensure:
   - All epics are consistently left-aligned
   - Long titles wrap properly without breaking layout
   - Maintains existing hover and active states
   - Preserves visual hierarchy in the sidebar

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
