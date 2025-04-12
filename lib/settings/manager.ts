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

// For testing settings file storage
export async function testSettingsStorage() {
  console.log("TEST: Testing settings file storage...");
  try {
    const response = await fetch("/api/test-storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        test: true,
        message: "Test storage operation",
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Storage test failed: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    console.log("TEST: Settings storage test result:", result);
    return result;
  } catch (error) {
    console.error("TEST: Settings storage test error:", error);
    throw error;
  }
}

// Settings-specific operations
export async function getDisplaySettings(): Promise<DisplaySettings> {
  try {
    console.log("Fetching display settings...");
    const response = await fetch("/api/settings");

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to fetch settings:", error);
      throw new Error(`Failed to fetch settings: ${error}`);
    }

    const data = await response.json();
    console.log("Received display settings:", data.display);

    if (!data.display) {
      console.log("No display settings found, using defaults");
      return DEFAULT_DISPLAY_SETTINGS;
    }

    // Validate the data
    return DisplaySettingsSchema.parse(data.display);
  } catch (error) {
    console.error("Error getting display settings:", error);
    return DEFAULT_DISPLAY_SETTINGS;
  }
}

export async function updateDisplaySettings(
  updates: Partial<DisplaySettings>,
): Promise<DisplaySettings> {
  console.log("Updating display settings with:", updates);

  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "display",
        data: updates,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to update settings:", error);
      throw new Error(`Failed to update settings: ${error}`);
    }

    const data = await response.json();
    console.log("Settings update response:", data);

    if (!data.display) {
      throw new Error("No display settings returned from update");
    }

    // Validate the response data
    return DisplaySettingsSchema.parse(data.display);
  } catch (error) {
    console.error("Settings update error:", error);
    throw error;
  }
}

export async function getUserSettings(
  userId: string,
  email: string,
): Promise<UserSettings> {
  try {
    console.log("getUserSettings: Fetching user settings for:", userId);
    const response = await fetch("/api/settings");

    if (!response.ok) {
      console.error(
        "getUserSettings: Failed to fetch settings:",
        response.status,
        response.statusText,
      );
      throw new Error("Failed to fetch settings");
    }

    const data = await response.json();
    console.log("getUserSettings: Received settings data:", data);

    if (!data.settings) {
      console.log("getUserSettings: No settings found, creating defaults");
      return createDefaultUserSettings(userId, email);
    }

    console.log(
      "getUserSettings: Returning settings with gitSync:",
      data.settings.gitSync,
    );
    return data.settings || createDefaultUserSettings(userId, email);
  } catch (error) {
    console.error("Error getting user settings:", error);
    return createDefaultUserSettings(userId, email);
  }
}

export async function updateUserSettings(
  updates: Partial<UserSettings>,
): Promise<UserSettings> {
  console.log("updateUserSettings: Sending updates to server:", {
    updates,
    gitSync: updates.gitSync,
  });

  try {
    const requestBody = JSON.stringify({
      type: "settings",
      data: updates,
    });

    console.log("updateUserSettings: Request body:", requestBody);

    const response = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to update user settings:", errorText);
      throw new Error(`Failed to update user settings: ${errorText}`);
    }

    const responseData = await response.json();
    console.log("updateUserSettings: Received response:", responseData);
    console.log("updateUserSettings: Received updated settings from server:", {
      settings: responseData.settings,
      gitSync: responseData.settings?.gitSync,
    });

    return responseData.settings;
  } catch (error) {
    console.error("updateUserSettings: Error during fetch:", error);
    throw error;
  }
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
