---
title: Fix Tag Input Dialog Escape Key Behavior
status: todo
priority: high
created: 2024-01-21T00:00:00.000Z
owner: AI
complexity: M
epic: tag-system
tags:
  - bug
  - tag-system
  - ux
dependencies:
  - implement-tag-system
ref: TSK-223
---

# Fix Tag Input Dialog Escape Key Behavior

## Problem

When using the tag input inside a dialog:

1. Opening the tag input dropdown
2. Pressing escape
3. Instead of just closing the dropdown, it closes the entire dialog

This creates a poor user experience as users lose their work when trying to dismiss the tag suggestions.

## Root Cause Analysis

- Radix UI Dialog uses a low-level keyboard event listener
- Event capturing happens before our component's event handlers
- Current event prevention methods are not stopping the Dialog from receiving the escape key event

## Success Criteria

- [ ] Pressing escape with tag dropdown open only closes the dropdown
- [ ] Pressing escape with tag dropdown closed closes the dialog
- [ ] No regression in other dialog or tag input functionality
- [ ] Works consistently across different browsers

## Implementation Details

Potential solutions to investigate:

1. Dialog-level prevention using onOpenChange
2. Content-level prevention using onEscapeKeyDown
3. Portal-based solution for tag dropdown
4. Custom event handler with capture phase
5. Radix UI built-in solutions for nested dismissable components

Choose and implement the most robust solution that:

- Handles events at the appropriate level
- Follows Radix UI patterns
- Minimizes complexity and side effects
- Ensures consistent behavior

## Implementation Notes

To be added during implementation.

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
