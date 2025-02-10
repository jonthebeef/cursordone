import {
  DisplaySettings,
  UserSettings,
  AnalyticsData,
  DisplaySettingsSchema,
  UserSettingsSchema,
  AnalyticsDataSchema,
  DEFAULT_DISPLAY_SETTINGS,
  createDefaultUserSettings,
  createDefaultAnalyticsData,
} from "./types";

// Settings-specific operations
export async function getDisplaySettings(): Promise<DisplaySettings> {
  try {
    const response = await fetch("/api/settings");
    if (!response.ok) throw new Error("Failed to fetch settings");
    const { display } = await response.json();
    return display || DEFAULT_DISPLAY_SETTINGS;
  } catch (error) {
    console.error("Error getting display settings:", error);
    return DEFAULT_DISPLAY_SETTINGS;
  }
}

export async function updateDisplaySettings(
  updates: Partial<DisplaySettings>,
): Promise<DisplaySettings> {
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "display",
      data: updates,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update display settings");
  }

  const { display } = await response.json();
  return display;
}

export async function getUserSettings(
  userId: string,
  email: string,
): Promise<UserSettings> {
  try {
    const response = await fetch("/api/settings");
    if (!response.ok) throw new Error("Failed to fetch settings");
    const { settings } = await response.json();
    return settings || createDefaultUserSettings(userId, email);
  } catch (error) {
    console.error("Error getting user settings:", error);
    return createDefaultUserSettings(userId, email);
  }
}

export async function updateUserSettings(
  updates: Partial<UserSettings>,
): Promise<UserSettings> {
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "settings",
      data: updates,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update user settings");
  }

  const { settings } = await response.json();
  return settings;
}

export async function getAnalyticsData(userId: string): Promise<AnalyticsData> {
  try {
    const response = await fetch("/api/settings");
    if (!response.ok) throw new Error("Failed to fetch settings");
    const { analytics } = await response.json();
    return analytics || createDefaultAnalyticsData(userId);
  } catch (error) {
    console.error("Error getting analytics data:", error);
    return createDefaultAnalyticsData(userId);
  }
}

export async function updateAnalyticsData(
  updates: Partial<AnalyticsData>,
): Promise<AnalyticsData> {
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "analytics",
      data: updates,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update analytics data");
  }

  const { analytics } = await response.json();
  return analytics;
}

// Avatar management
export async function saveAvatar(
  userId: string,
  file: File | Blob,
  filename: string,
): Promise<string> {
  console.log("Saving avatar:", { userId, filename, fileSize: file.size });

  const formData = new FormData();
  formData.append("avatar", file, filename);
  formData.append("userId", userId);

  const response = await fetch("/api/upload-avatar", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to save avatar:", error);
    throw new Error(`Failed to save avatar: ${error}`);
  }

  const { avatarPath } = await response.json();
  console.log("Avatar saved successfully:", avatarPath);
  return avatarPath;
}

// Migration helpers
export async function migrateFromSupabase(
  userId: string,
  email: string,
  profile: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  },
): Promise<void> {
  console.log("Starting migration for user:", userId);
  console.log("Profile data:", profile);

  // Create display settings
  const displayName = profile.full_name || profile.name;
  console.log("Setting display name:", displayName);

  // First get existing settings
  const existingDisplay = await getDisplaySettings();

  // If we have an avatar URL and either no existing avatar or a different one
  if (profile.avatar_url) {
    try {
      console.log("Fetching avatar from:", profile.avatar_url);
      const response = await fetch(profile.avatar_url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch avatar: ${response.status} ${response.statusText}`,
        );
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Avatar blob is empty");
      }
      console.log("Avatar blob size:", blob.size);

      const filename = `${userId}-${profile.avatar_url.split("/").pop() || "avatar.jpg"}`;
      console.log("Using filename:", filename);

      const avatarPath = await saveAvatar(userId, blob, filename);
      console.log("Avatar saved with path:", avatarPath);

      await updateDisplaySettings({
        ...existingDisplay,
        displayName,
        avatarPath,
      });
      console.log("Display settings updated with new avatar path");
    } catch (error) {
      console.error("Error migrating avatar:", error);
      // Update display name even if avatar fails
      await updateDisplaySettings({
        ...existingDisplay,
        displayName,
      });
    }
  } else {
    console.log("No avatar URL found in profile");
    await updateDisplaySettings({
      ...existingDisplay,
      displayName,
    });
  }

  // Create user settings
  await getUserSettings(userId, email);

  // Initialize analytics
  await getAnalyticsData(userId);
}
