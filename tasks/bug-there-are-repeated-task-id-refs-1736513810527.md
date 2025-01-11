---
ref: TSK-057
title: 'BUG: There are repeated task id refs'
status: todo
priority: high
epic: ui-cleanup
dependencies: []
tags:
  - task refs
created: '2025-01-10'
---
I looked at the used refs from the json file, and found that several have been repeated (eg, there's 2 tasks with IDs of TSK-019)

I did a quick comparison in a spreadsheet. 

TSK-17 18 19 20 24 26 27 28 46 are all duplicates

when we go to production, this needs to be bulletproof

is this a legacy issue, or an ongoing problem
