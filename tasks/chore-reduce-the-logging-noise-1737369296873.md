---
ref: TSK-216
title: "CHORE: Reduce the logging noise"
status: done
priority: medium
complexity: S
epic: ui-cleanup
owner: user
dependencies: []
tags:
  - logs
created: "2025-01-20"
started_date: "2025-02-10"
worker: user
completion_date: "2025-02-10"
---

In both the terminal and the console, there are a lot of logs coming through for dependencies based on a fix that we did earlier in the process. They are very noisy and list out all of the dependencies for each task, but we now need to remove these logs because as I said, they are very noisy. Can you look at all of the logging that has been set up for dependencies and remove this to remove the noise from both the console logs and the terminal readout?

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
