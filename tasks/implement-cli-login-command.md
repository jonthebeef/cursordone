---
title: Implement CLI login command
status: todo
priority: high
epic: authentication-integration
dependencies:
  - enable-authentication-providers.md
tags:
  - cli
  - authentication
  - supabase
created: 2025-01-10T00:00:00.000Z
ref: TSK-068
---
Implement the `cursordone login` CLI command to authenticate users via Supabase. Include the following:

1. Support email/password login.
2. Redirect users to browser-based OAuth login for GitHub/Google.
3. Save the session token locally in `~/.cursordone/config.json`.

Deliverable:
- A working CLI login command supporting multiple authentication methods.
- Session data stored locally.
