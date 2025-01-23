---
title: Implement Supabase Ref Ledger
status: todo
priority: high
created: "2024-01-22"
owner: AI
complexity: S
epic: team-collaboration
tags:
  - teams-2
  - team-config
  - supabase
  - refs
ref: TSK-260
---

# Implement Supabase Ref Ledger

Create the Supabase-based reference management system for task tracking across teams.

## Success Criteria

- [ ] Supabase schema implemented for refs
- [ ] Unique ref generation working
- [ ] Ref-to-task mapping functional
- [ ] Team isolation working correctly
- [ ] Basic activity tracking implemented
- [ ] Efficient querying demonstrated

## Implementation Details

1. Database Schema

   - Create tasks_refs table
   - Create tasks_activity table
   - Implement row level security
   - Set up indexes

2. Ref Generation

   - Implement atomic ref generation
   - Handle concurrent requests
   - Ensure team isolation
   - Prevent duplicates

3. API Integration
   - Create ref management endpoints
   - Implement activity tracking
   - Add team awareness features
   - Handle offline scenarios

## Dependencies

- implement-conflict-detection

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
