---
ref: TSK-069
title: Test authentication flows
status: done
priority: high
complexity: S
category: feature
epic: testing-and-validation
owner: AI
dependencies:
  - enable-authentication-providers
  - implement-cli-login-command
tags:
  - testing
  - authentication
  - supabase
  - day 4
created: '2025-01-10'
---
Test all authentication flows for both CLI and UI. Include the following:

1. Test Google and GitHub OAuth login flows.
2. Test email/password login via CLI.
3. Verify session tokens are saved correctly and validated for subsequent operations.

Deliverable:

- Test cases for all authentication flows documented.
- All tests pass with no regressions.

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
