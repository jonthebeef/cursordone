---
title: Implement Local Settings System
status: todo
priority: high
created: 2024-01-27
owner: AI
complexity: M
category: feature
epic: user-management
tags:
  - settings
  - user-data
  - analytics
dependencies:
  - implement-user-profile-section.md
ref: TSK-273
---

# Implement Local Settings System

Replace the Supabase-based profile system with a local file-based settings system that handles both public and private user data.

## Success Criteria

- [ ] Local settings file structure created
- [ ] Git-ignored local user settings working
- [ ] Git-tracked display settings working
- [ ] Analytics data collection working
- [ ] Existing profile system removed
- [ ] Migration path for existing users

## Implementation Details

### File Structure Setup

- [ ] Create `.cursordone/user/` directory
- [ ] Create `settings.local.json` for private data
- [ ] Create `display.json` for public data
- [ ] Create `analytics/usage.local.json` for analytics
- [ ] Update `.gitignore` for local files

### Local Settings Implementation

- [ ] Create settings management utilities
- [ ] Implement settings file creation on first run
- [ ] Add file watchers for settings sync
- [ ] Add validation for settings files
- [ ] Create settings provider component

### Display Settings

- [ ] Modify ProfileForm to use local settings
- [ ] Update avatar storage to use local files
- [ ] Implement git-sync for display settings
- [ ] Add conflict resolution for display settings

### Analytics Integration

- [ ] Set up analytics data collection
- [ ] Implement periodic data sync
- [ ] Add privacy controls
- [ ] Create analytics dashboard integration

### Cleanup

- [ ] Remove Supabase profile tables
- [ ] Clean up unused migrations
- [ ] Remove Supabase-specific code from components
- [ ] Update auth flow to work without profiles

## Files to Change

1. Modify (remove Supabase integration):

   - `components/user/profile-form.tsx`
   - `components/user/profile-button.tsx`
   - `app/(main)/profile/page.tsx`

2. Create:

   - `.cursordone/user/settings.local.json`
   - `.cursordone/user/display.json`
   - `.cursordone/analytics/usage.local.json`
   - `lib/settings/types.ts`
   - `lib/settings/manager.ts`
   - `components/providers/settings-provider.tsx`

3. Update:
   - `.gitignore` (add \*.local.json patterns)
   - `components/sidebar.tsx` (use settings provider)
   - `app/layout.tsx` (add settings provider)

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
