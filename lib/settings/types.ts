import { z } from "zod";

// Display settings - public, git tracked
export const DisplaySettingsSchema = z.object({
  version: z.number().default(1),
  displayName: z.string().optional(),
  avatarPath: z.string().optional(),
  avatarUrl: z.string().optional(), // For remote avatars (e.g. GitHub)
  role: z.string().optional(),
  location: z.string().optional(),
  theme: z.enum(["system", "light", "dark"]).default("system"),
  accentColor: z.string().optional(),
  showGitMetrics: z.boolean().default(true),
  compactMode: z.boolean().default(false),
});

export type DisplaySettings = z.infer<typeof DisplaySettingsSchema>;

// Git sync settings schema
export const GitSyncSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  repoPath: z.string().optional(),
  repoUrl: z.string().optional(),
  branchName: z.string().default("main"),
  autoPullEnabled: z.boolean().default(true),
  autoPushEnabled: z.boolean().default(true),
  autoPullInterval: z.number().min(1).max(60).default(5), // Minutes
  batchCommitsThreshold: z.number().min(1).max(50).default(5), // Files
  batchCommitsTimeout: z.number().min(5000).max(3600000).default(30000), // Milliseconds
  gitPaths: z.array(z.string()).default(["tasks", "epics", "docs"]),
});

export type GitSyncSettings = z.infer<typeof GitSyncSettingsSchema>;

// User settings - private, git ignored
export const UserSettingsSchema = z.object({
  version: z.number().default(1),
  userId: z.string(),
  email: z.string().email(),
  lastSynced: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
  preferences: z
    .object({
      autoSave: z.boolean().default(true),
      syncInterval: z.number().min(1).max(60).default(5),
      telemetryEnabled: z.boolean().default(true),
      backupEnabled: z.boolean().default(true),
    })
    .default({}),
  tokens: z
    .object({
      github: z.string().optional(),
      discord: z.string().optional(),
    })
    .optional()
    .default({}),
  gitSync: GitSyncSettingsSchema.default({}),
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

export const DEFAULT_GIT_SYNC_SETTINGS: GitSyncSettings = {
  enabled: true,
  repoPath: "",
  repoUrl: "",
  branchName: "main",
  autoPullEnabled: true,
  autoPushEnabled: true,
  autoPullInterval: 5, // Minutes
  batchCommitsThreshold: 5, // Files
  batchCommitsTimeout: 30000, // Milliseconds (30 seconds)
  gitPaths: ["tasks", "epics", "docs"],
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
  tokens: {},
  gitSync: DEFAULT_GIT_SYNC_SETTINGS,
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
