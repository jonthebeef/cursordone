---
ref: TSK-066
title: Enable authentication providers
status: todo
priority: high
epic: authentication-integration
dependencies: []
tags:
  - authentication
  - oauth
  - supabase
  - day-4
created: 2025-01-10T00:00:00.000Z
---

Enable Google and GitHub OAuth authentication in Supabase. Perform the following steps:

1. Configure GitHub OAuth in the Supabase dashboard:

   - Set the authorization callback URL to `<SUPABASE_URL>/auth/v1/callback`.
   - Obtain and store the client ID and client secret in Supabase settings.

2. Configure Google OAuth in the Supabase dashboard:

   - Set the redirect URI to `<SUPABASE_URL>/auth/v1/callback`.
   - Obtain and store the client ID and client secret in Supabase settings.

3. Add redirect URLs for local (`http://localhost:3000`) and production environments in Supabase settings.

Deliverable:

- Google and GitHub OAuth configured in Supabase.
- Redirect URLs tested and verified.
