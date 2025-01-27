---
title: Add command pattern support to cursor rules
status: todo
priority: high
complexity: M
epic: cursor-integration
tags:
  - enhancement
  - cursor
  - day 2
created: '2024-01-15'
owner: AI
ref: TSK-267
---

# Command Pattern Support for Cursor Rules

Add support for natural language command patterns in `.cursorrules` to allow easier task access and management through the Cursor composer.

## Current Issues

1. Task access requires specific syntax
2. No natural language support
3. Manual file searching required
4. Limited command capabilities

## Required Changes

1. Add command patterns section to `.cursorrules`:
   - Define natural language patterns
   - Map patterns to script executions
   - Specify argument extraction
   - Add usage examples

2. Create basic script infrastructure:
   - Task finder script
   - Pattern matching utilities
   - Argument parser
   - Response formatter

3. Test basic commands:
   - "pick up TSK-XXX"
   - "@TSK-XXX"
   - "find task {query}"

# Success Criteria

- [ ] Command patterns section added to `.cursorrules`
- [ ] Basic script infrastructure implemented
- [ ] Test commands working in Cursor composer
- [ ] Natural language patterns successfully matched
- [ ] Task data correctly returned
- [ ] Documentation updated with command usage

# Implementation Details

1. Add to `.cursorrules`:
yaml
commands:
task_actions:
patterns:
"pick up TSK-{ref}"
"@TSK-{ref}"
command: "node scripts/tasks/get-task.js"
args:
ref: string

2. Create script structure:
scripts/
tasks/
get-task.js # Task finder
search.js # Task search
utils/
patterns.js # Pattern matching
args.js # Argument parsing


3. Basic implementation flow:
   - Pattern matched in Cursor
   - Arguments extracted
   - Script executed
   - Task data returned
   - AI processes response

## File Changes

| File | Changes Made |
|------|--------------|
| `.cursorrules` | Add commands section with patterns |
| `scripts/tasks/get-task.js` | Create task finder script |
| `scripts/tasks/search.js` | Create task search script |
| `scripts/utils/patterns.js` | Create pattern matching utilities |
| `scripts/utils/args.js` | Create argument parsing utilities |
| `docs/cursor-commands.md` | Add command documentation |

---

## Guidelines
- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer 
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
