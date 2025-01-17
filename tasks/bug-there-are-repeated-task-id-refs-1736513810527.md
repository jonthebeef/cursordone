---
ref: TSK-057
title: 'BUG: There are repeated task id refs'
status: done
priority: high
epic: ui-cleanup
dependencies: []
tags:
  - task refs
created: '2025-01-10'
owner: AI
complexity: M
---
I looked at the used refs from the json file, and found that several have been repeated (eg, there's 2 tasks with IDs of TSK-019)

I did a quick comparison in a spreadsheet. 

TSK-17 18 19 20 24 26 27 28 46 are all duplicates

when we go to production, this needs to be bulletproof

is this a legacy issue, or an ongoing problem

# Implementation Notes

Created two scripts to handle duplicate task references:

1. `fix-duplicate-refs.ts`: One-time fix script that:
   - Identifies duplicate refs across all task files
   - Retains the oldest task's ref for each duplicate
   - Assigns new unique refs to newer duplicates
   - Preserves all task content and relationships
   - Successfully fixed 11 duplicate refs including TSK-017, 018, 019, 020, 024, 026, 027, 028, and 046

2. `validate-task-refs.ts`: Enhanced validation script that:
   - Checks for missing, invalid, and duplicate refs
   - Identifies gaps in ref sequence
   - Provides detailed reports with colored output
   - Includes auto-fix mode with `--fix` flag
   - Returns non-zero exit code for CI integration

Both scripts were run successfully, resolving all duplicate refs and ensuring the integrity of the task reference system.
