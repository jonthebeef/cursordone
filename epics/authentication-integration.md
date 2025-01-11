---
title: Authentication integration
description: Manage user authentication via Supabase, including OAuth and session handling.
status: todo
priority: high
tags:
  - authentication
  - supabase
  - oauth
created: 2025-01-10
---

# Authentication Integration

This epic focuses on integrating Supabase authentication into the system, enabling OAuth for Google and GitHub, and supporting session management within the CLI and UI.

## Objectives

1. Enable Google and GitHub OAuth authentication in Supabase.
2. Implement CLI commands for user login and signup.
3. Store and validate user sessions locally.

## Key Features

1. **Authentication Providers**
   - Configure GitHub and Google OAuth in the Supabase dashboard.
   - Update redirect URLs for local and production environments.

2. **CLI Commands**
   - `cursordone login` for email/password or OAuth login.
   - `cursordone signup` for new users.

3. **Session Handling**
   - Store session data locally in `~/.cursordone/config.json`.
   - Validate sessions before executing CLI commands.

## Success Criteria

- [ ] Users can log in via Google/GitHub OAuth.
- [ ] CLI commands for login and signup work seamlessly.
- [ ] Session data is securely stored and validated.

## Related Tasks

- [Enable Authentication Providers](/tasks/enable-authentication-providers.md)
- [Implement CLI Login Command](/tasks/implement-cli-login-command.md)
- [Handle User Sessions](/tasks/handle-user-sessions.md)