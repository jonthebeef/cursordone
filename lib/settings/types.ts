import { z } from "zod";

// Display settings - public, git tracked
export const DisplaySettingsSchema = z.object({
  version: z.number().default(1),
  displayName: z.string().optional(),
  avatarPath: z.string().optional(),
  theme: z.enum(["system", "light", "dark"]).default("system"),
  accentColor: z.string().optional(),
  showGitMetrics: z.boolean().default(true),
  compactMode: z.boolean().default(false),
});

export type DisplaySettings = z.infer<typeof DisplaySettingsSchema>;

// User settings - private, git ignored
export const UserSettingsSchema = z.object({
  version: z.number().default(1),
  userId: z.string(),
  email: z.string().email(),
  lastSynced: z.string().datetime(),
  preferences: z.object({
    autoSave: z.boolean().default(true),
    syncInterval: z.number().min(1).max(60).default(5),
    telemetryEnabled: z.boolean().default(true),
    backupEnabled: z.boolean().default(true),
  }),
  tokens: z
    .object({
      github: z.string().optional(),
      discord: z.string().optional(),
    })
    .optional(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

// Analytics data - private, git ignored
export const AnalyticsDataSchema = z.object({
  version: z.number().default(1),
  userId: z.string(),
  sessionCount: z.number().default(0),
  lastSession: z.string().datetime().optional(),
  taskMetrics: z.object({
    created: z.number().default(0),
    completed: z.number().default(0),
    averageTimeToComplete: z.number().default(0),
  }),
  featureUsage: z.record(z.number()).default({}),
});

export type AnalyticsData = z.infer<typeof AnalyticsDataSchema>;

// Default settings
export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  version: 1,
  theme: "system",
  showGitMetrics: true,
  compactMode: false,
};

export const createDefaultUserSettings = (
  userId: string,
  email: string,
): UserSettings => ({
  version: 1,
  userId,
  email,
  lastSynced: new Date().toISOString(),
  preferences: {
    autoSave: true,
    syncInterval: 5,
    telemetryEnabled: true,
    backupEnabled: true,
  },
});

export const createDefaultAnalyticsData = (userId: string): AnalyticsData => ({
  version: 1,
  userId,
  sessionCount: 0,
  taskMetrics: {
    created: 0,
    completed: 0,
    averageTimeToComplete: 0,
  },
  featureUsage: {},
});
