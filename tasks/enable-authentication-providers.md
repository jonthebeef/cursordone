---
ref: TSK-066
title: Enable authentication providers
status: in-progress
priority: high
epic: authentication-integration
dependencies: []
tags:
  - authentication
  - oauth
  - supabase
  - day 4
created: 2025-01-10T00:00:00.000Z
owner: AI
worker: AI
started_date: 2024-01-21
complexity: M
---

# Enable authentication providers

Implement Discord and GitHub OAuth authentication using Supabase's new SSR package and Next.js 15 Server Components.

## Implementation Plan

1. Clean up existing implementation:

   - Remove custom route handlers
   - Remove custom cookie management
   - Remove client-side session management
   - Keep UI components but disconnect auth logic

2. Configure providers in Supabase:

   - Set up GitHub OAuth
   - Set up Discord OAuth
   - Configure callback URLs
   - Set proper scopes and permissions

3. Implement new auth architecture:

   - Use @supabase/ssr package
   - Implement Server Actions for auth
   - Use Next.js middleware for protection
   - Let Supabase handle cookies

4. Update UI components:
   - Connect to Server Actions
   - Implement proper loading states
   - Add error handling
   - Ensure proper redirects

## Files to Clean Up

1. Route Handlers:

   - `app/auth/callback/route.ts`
   - Any other custom auth routes

2. Client Configuration:

   - `lib/supabase/client.ts`
   - Remove custom cookie handling

3. Session Management:
   - `lib/hooks/use-session.ts`
   - Remove custom state management

## Success Criteria

- [ ] Clean implementation using @supabase/ssr
- [ ] Working GitHub and Discord OAuth
- [ ] Proper session management
- [ ] Clean error handling
- [ ] No custom cookie management

## Testing Instructions

1. Test OAuth flows with both providers
2. Verify session persistence
3. Check error handling
4. Test protected routes
5. Verify logout flow

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
