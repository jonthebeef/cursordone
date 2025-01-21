---
title: Implement Local-First PostHog Analytics
status: todo
priority: high
complexity: L
category: feature
owner: AI
created: 2025-01-21T00:00:00.000Z
epic: system-rebuild
tags:
  - analytics
  - monitoring
  - posthog
  - privacy
  - local-first
ref: TSK-228
---

# Implement Local-First PostHog Analytics

Implement privacy-focused PostHog analytics for local usage, ensuring users are informed and in control of their data collection.

## Success Criteria

- [ ] Create privacy-first analytics implementation
- [ ] Implement user consent management
- [ ] Add analytics configuration options
- [ ] Create privacy documentation
- [ ] Implement data collection controls
- [ ] Set up offline event queuing
- [ ] Create local-only mode

## Implementation Details

### 1. User Consent & Privacy Notice

Create a privacy notice component that appears on first run:

```typescript
// components/privacy-notice.tsx
interface AnalyticsSettings {
  enabled: boolean;
  collectErrors: boolean;
  collectUsage: boolean;
  collectPerformance: boolean;
  allowIdentification: boolean;
}

const defaultSettings: AnalyticsSettings = {
  enabled: false,
  collectErrors: false,
  collectUsage: false,
  collectPerformance: false,
  allowIdentification: false,
};
```

### 2. Analytics Configuration

Add to user settings:

```typescript
// lib/settings.ts
interface UserSettings {
  // ... existing settings
  analytics: {
    enabled: boolean;
    errorReporting: boolean;
    usageTracking: boolean;
    performanceMonitoring: boolean;
    allowIdentification: boolean;
    dataRetentionDays: number;
  };
}
```

### 3. Privacy-First PostHog Setup

```typescript
// lib/analytics.ts
import posthog from "posthog-js";
import { getUserSettings } from "./settings";

export async function initializeAnalytics() {
  const settings = await getUserSettings();

  if (!settings.analytics.enabled) {
    return;
  }

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    autocapture: false, // Disable automatic event capture
    capture_pageview: settings.analytics.usageTracking,
    capture_pageleave: settings.analytics.usageTracking,
    disable_session_recording: true, // Always disable
    disable_persistence: !settings.analytics.allowIdentification,
    persistence: settings.analytics.allowIdentification
      ? "localStorage"
      : "memory",
    bootstrap: {
      distinctID: settings.analytics.allowIdentification
        ? getUserIdentifier()
        : generateAnonymousId(),
    },
  });

  // Apply privacy settings
  if (!settings.analytics.allowIdentification) {
    posthog.opt_out_capturing();
  }
}
```

### 4. Event Tracking with Privacy Controls

```typescript
// lib/analytics/events.ts
export async function trackEvent(
  eventName: string,
  properties: Record<string, any>,
) {
  const settings = await getUserSettings();

  if (!settings.analytics.enabled) {
    return;
  }

  // Strip PII from properties
  const safeProperties = sanitizeProperties(properties);

  // Only track if relevant setting is enabled
  if (isErrorEvent(eventName) && !settings.analytics.errorReporting) return;
  if (isUsageEvent(eventName) && !settings.analytics.usageTracking) return;
  if (
    isPerformanceEvent(eventName) &&
    !settings.analytics.performanceMonitoring
  )
    return;

  posthog.capture(eventName, safeProperties);
}

// Event categories to track
const events = {
  // Task Management
  task: {
    status_changed: "task_status_changed",
    complexity_changed: "task_complexity_changed",
    search_performed: "task_search_performed",
    filtered: "task_filtered",
    sorted: "task_sorted",
    tag_added: "task_tag_added",
    tag_removed: "task_tag_removed",
    dependency_added: "task_dependency_added",
    dependency_removed: "task_dependency_removed",
    priority_changed: "task_priority_changed",
    owner_changed: "task_owner_changed",
    worker_changed: "task_worker_changed",
    epic_changed: "task_epic_changed",
    due_date_changed: "task_due_date_changed",
    started_date_set: "task_started_date_set",
    completion_date_set: "task_completion_date_set",
    comments_updated: "task_comments_updated",
  },

  // Epic Analytics
  epic: {
    tasks_viewed: "epic_tasks_viewed",
    progress_updated: "epic_progress_updated",
    status_changed: "epic_status_changed",
    created: "epic_created",
    updated: "epic_updated",
    deleted: "epic_deleted",
    priority_changed: "epic_priority_changed",
    description_updated: "epic_description_updated",
    tags_updated: "epic_tags_updated",
  },

  // UI Interactions
  ui: {
    sidebar_toggled: "sidebar_toggled",
    theme_changed: "theme_changed",
    filter_applied: "filter_applied",
    sort_changed: "sort_changed",
    board_view_changed: "board_view_changed",
    list_view_toggled: "list_view_toggled",
  },

  // User Actions
  user: {
    signed_up: "user_signed_up",
    logged_in: "user_logged_in",
    logged_out: "user_logged_out",
    updated_profile: "user_updated_profile",
    settings_changed: "settings_changed",
  },

  // Document Management
  doc: {
    created: "doc_created",
    updated: "doc_updated",
    deleted: "doc_deleted",
    viewed: "doc_viewed",
    type_changed: "doc_type_changed",
    epic_linked: "doc_epic_linked",
    epic_unlinked: "doc_epic_unlinked",
    dependencies_updated: "doc_dependencies_updated",
    tags_updated: "doc_tags_updated",
  },

  // Engagement
  engagement: {
    session_started: "session_started",
    session_ended: "session_ended",
    notification_sent: "notification_sent",
    notification_clicked: "notification_clicked",
  },

  // Onboarding
  onboarding: {
    started: "onboarding_started",
    step_completed: "onboarding_step_completed",
    completed: "onboarding_completed",
    first_task_created: "first_task_created",
    first_task_assigned: "first_task_assigned",
  },

  // Performance & Errors
  system: {
    error_logged: "error_logged",
    api_failure: "api_failure",
    page_crash: "page_crash",
    slow_query: "slow_query_detected",
    performance_issue: "performance_issue_detected",
  },

  // Example properties for front matter events
  propertyExamples: {
    task: {
      priority_changed: {
        old_priority: "low | medium | high",
        new_priority: "low | medium | high",
        task_id: "string",
      },
      complexity_changed: {
        old_complexity: "XS | S | M | L | XL",
        new_complexity: "XS | S | M | L | XL",
        task_id: "string",
      },
      status_changed: {
        old_status: "todo | in-progress | done",
        new_status: "todo | in-progress | done",
        task_id: "string",
        time_in_status: "number", // milliseconds
      },
    },
    epic: {
      status_changed: {
        old_status: "pending | active | completed",
        new_status: "pending | active | completed",
        epic_id: "string",
      },
    },
    doc: {
      type_changed: {
        old_type:
          "documentation | architecture | guide | api | delivery | product | business | design | stakeholders | operations",
        new_type:
          "documentation | architecture | guide | api | delivery | product | business | design | stakeholders | operations",
        doc_id: "string",
      },
    },
  },
};

export { events };
```

### 5. Required User Notifications

Create a privacy policy section that clearly states:

1. What data is collected:

   - Usage data (if enabled):
     - Feature usage patterns
     - Task management metrics
     - Navigation patterns
   - Error data (if enabled):
     - Error messages
     - Stack traces
     - System info
   - Performance data (if enabled):
     - Load times
     - Response times
     - Resource usage

2. User Controls:

   - Enable/disable all analytics
   - Granular control over:
     - Usage tracking
     - Error reporting
     - Performance monitoring
   - Data retention period
   - Right to delete data

3. Data Storage:
   - Data stored locally by default
   - Optional: Anonymous data sharing
   - Data retention policies
   - Data export capabilities

### 6. Settings UI Implementation

```typescript
// components/settings/analytics-settings.tsx
export function AnalyticsSettings() {
  const [settings, setSettings] = useState<AnalyticsSettings>()

  return (
    <div className="space-y-4">
      <h2>Analytics & Privacy Settings</h2>

      <Toggle
        label="Enable Analytics"
        description="Help improve the app by sharing anonymous usage data"
        checked={settings.enabled}
        onChange={(enabled) => updateSetting('enabled', enabled)}
      />

      {settings.enabled && (
        <>
          <Toggle
            label="Track Usage Patterns"
            description="Collect anonymous data about feature usage"
            checked={settings.collectUsage}
            onChange={(enabled) => updateSetting('collectUsage', enabled)}
          />

          <Toggle
            label="Error Reporting"
            description="Automatically report errors to help fix bugs"
            checked={settings.collectErrors}
            onChange={(enabled) => updateSetting('collectErrors', enabled)}
          />

          <Toggle
            label="Performance Monitoring"
            description="Track app performance metrics"
            checked={settings.collectPerformance}
            onChange={(enabled) => updateSetting('collectPerformance', enabled)}
          />

          <Select
            label="Data Retention"
            value={settings.dataRetentionDays}
            options={[
              { label: '7 days', value: 7 },
              { label: '30 days', value: 30 },
              { label: '90 days', value: 90 }
            ]}
            onChange={(days) => updateSetting('dataRetentionDays', days)}
          />
        </>
      )}
    </div>
  )
}
```

### 7. Data Export & Deletion

```typescript
// lib/analytics/data-management.ts
export async function exportAnalyticsData() {
  const settings = await getUserSettings();
  if (!settings.analytics.enabled) return null;

  return posthog.get_session_replay_url(); // Get stored events
}

export async function deleteAnalyticsData() {
  await posthog.reset();
  // Clear local storage
  localStorage.removeItem("posthog_events");
  localStorage.removeItem("posthog_metadata");
}
```

## Dependencies

- None

## Privacy Compliance Checklist

- [ ] User must explicitly opt-in to analytics
- [ ] Clear privacy notice on first run
- [ ] Granular control over data collection
- [ ] Option to disable all tracking
- [ ] Data retention controls
- [ ] Export data capability
- [ ] Delete data capability
- [ ] No PII collection by default
- [ ] Offline-first consideration
- [ ] Clear documentation of all tracking

---

## Guidelines

- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis
