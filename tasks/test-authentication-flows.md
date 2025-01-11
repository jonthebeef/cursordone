---
title: Test authentication flows
status: todo
priority: high
epic: testing-and-validation
dependencies:
  - enable-authentication-providers.md
  - implement-cli-login-command.md
tags:
  - testing
  - authentication
  - supabase
created: '2025-01-10'
ref: TSK-069
---
Test all authentication flows for both CLI and UI. Include the following:

1. Test Google and GitHub OAuth login flows.
2. Test email/password login via CLI.
3. Verify session tokens are saved correctly and validated for subsequent operations.

Deliverable:
- Test cases for all authentication flows documented.
- All tests pass with no regressions.
