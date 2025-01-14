---
title: Update task front matter schema
status: todo
priority: high
complexity: M
epic: task-management-enhancement
dependencies: []
tags:
  - schema
  - front-matter
created: "2024-01-15"
ref: TSK-145
---

# Update Task Front Matter Schema

Update the front matter schema to include new fields for better task tracking and RAG capabilities.

## Changes Required

1. New Fields to Add:

   - `due_date`: Optional date for task completion target
   - `owner`: Optional string for task assignee
   - `completion_date`: Optional date, auto-filled when status -> done
   - `comments`: Optional string for quick status notes/blockers

2. Documentation Updates:

   - Update system-architecture.md schema section
   - Update TypeScript interfaces
   - Add validation rules for new fields

3. Migration Plan:
   - Create migration script for existing tasks
   - Ensure backward compatibility
   - Add validation for new fields

## Success Criteria

- [ ] New fields added to schema
- [ ] Documentation updated
- [ ] Migration script created and tested
- [ ] Existing tasks remain compatible
