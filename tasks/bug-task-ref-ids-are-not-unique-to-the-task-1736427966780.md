---
ref: TSK-035
title: 'BUG: Task ref IDs are not unique to the task'
status: todo
priority: high
epic: ui-cleanup
dependencies: []
tags:
  - task id
  - ref
created: '2025-01-09'
---
I've just noticed that task IDs are either getting re-used, or reassigned to new tasks

Task IDs need to be unique to the task itself, and should not be re-used, otherwise we will get very confused.

Please investigate and fix
