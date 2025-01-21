---
title: Implement PostHog Analytics with Event Tracking
status: todo
priority: high
complexity: L
category: feature
owner: AI
created: 2025-01-21
epic: system-rebuild
tags:
  - analytics
  - monitoring
  - posthog
  - events
ref: TSK-229
---

# Implement PostHog Analytics with Event Tracking

Implement PostHog analytics to track user behavior, task lifecycle, feature usage, and other key metrics.

## Success Criteria

- [ ] Set up PostHog account and project
- [ ] Implement base tracking script
- [ ] Set up event tracking for all specified categories:
  - [ ] User Data events
  - [ ] Task Lifecycle events
  - [ ] Feature Usage events
  - [ ] Engagement events
  - [ ] Funnel Tracking
  - [ ] Productivity Metrics
  - [ ] Feedback events
  - [ ] Error tracking
- [ ] Create key funnels:
  - [ ] User onboarding funnel
  - [ ] Task creation to completion funnel
  - [ ] Feature adoption funnels
- [ ] Set up dashboards for different stakeholders
- [ ] Document implementation and event tracking guide

## Implementation Details

### 1. Initial Setup

```typescript
// app/layout.tsx
import posthog from "posthog-js";

// Initialize PostHog
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  });
}
```

### 2. User Identification

```typescript
// components/providers/auth-provider.tsx
import posthog from "posthog-js";

// After successful authentication
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  created_at: user.created_at,
  role: user.role,
});
```

### 3. Event Implementation by Category

#### User Data Events

```typescript
// User events
posthog.capture("user_signed_up", {
  source: source,
  referrer: document.referrer,
});

posthog.capture("user_logged_in", {
  method: method, // 'email', 'google', etc.
  last_login: lastLogin,
});
```

#### Task Lifecycle Events

```typescript
// lib/tasks.ts
import posthog from "posthog-js";

export async function createTask(task: Task) {
  // Existing task creation code...

  posthog.capture("task_created", {
    task_id: task.id,
    epic: task.epic,
    priority: task.priority,
    complexity: task.complexity,
    has_dependencies: task.dependencies?.length > 0,
    has_due_date: !!task.due_date,
  });
}

export async function completeTask(task: Task) {
  // Existing completion code...

  posthog.capture("task_completed", {
    task_id: task.id,
    time_to_complete: Date.now() - new Date(task.created).getTime(),
    overdue: isOverdue(task),
  });
}
```

#### Feature Usage Events

```typescript
// components/epic-list.tsx
posthog.capture("epic_created", {
  epic_id: epic.id,
  num_tasks: epic.tasks?.length,
});

// components/ui/docs-page.tsx
posthog.capture("doc_created", {
  doc_type: doc.type,
  has_dependencies: doc.dependencies?.length > 0,
});
```

#### Engagement Events

```typescript
// Track session data
window.addEventListener("load", () => {
  posthog.capture("session_started", {
    url: window.location.href,
    referrer: document.referrer,
  });
});

window.addEventListener("beforeunload", () => {
  posthog.capture("session_ended", {
    duration: sessionDuration,
    pages_viewed: pagesViewed,
  });
});
```

### 4. Funnel Setup

Create the following funnels in PostHog:

1. Onboarding Funnel:

   ```
   user_signed_up -> onboarding_started -> first_task_created -> onboarding_completed
   ```

2. Task Completion Funnel:

   ```
   task_created -> task_assigned -> task_updated -> task_completed
   ```

3. Feature Adoption Funnel:
   ```
   feature_viewed -> feature_interacted -> feature_adopted
   ```

### 5. Dashboard Setup

Create dashboards for:

1. User Engagement

   - Daily/weekly active users
   - Session duration
   - Feature usage

2. Task Analytics

   - Task completion rates
   - Time to completion
   - Popular task types

3. Error Monitoring
   - API failures
   - Page crashes
   - Slow queries

## Dependencies

- None

## Privacy Considerations

- Ensure no PII is captured in events
- Use PostHog's automatic IP anonymization
- Implement proper data retention policies
- Add analytics section to privacy policy

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
