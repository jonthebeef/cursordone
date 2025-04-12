import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";
import {
  DisplaySettingsSchema,
  UserSettingsSchema,
  AnalyticsDataSchema,
  DEFAULT_DISPLAY_SETTINGS,
  createDefaultUserSettings,
  createDefaultAnalyticsData,
} from "@/lib/settings/types";

const SETTINGS_DIR = ".cursordone";
const USER_DIR = path.join(SETTINGS_DIR, "user");
const ANALYTICS_DIR = path.join(SETTINGS_DIR, "analytics");

const PATHS = {
  display: path.join(USER_DIR, "display.json"),
  settings: path.join(USER_DIR, "settings.local.json"),
  analytics: path.join(ANALYTICS_DIR, "usage.local.json"),
} as const;

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(USER_DIR, { recursive: true });
    await fs.mkdir(ANALYTICS_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating directories:", error);
    throw error;
  }
}

// Generic file operations
async function readJsonFile<T>(
  filepath: string,
  schema: any,
): Promise<T | null> {
  try {
    const data = await fs.readFile(filepath, "utf-8");
    const parsed = JSON.parse(data);
    return schema.parse(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    console.error(`Error reading ${filepath}:`, error);
    return null;
  }
}

async function writeJsonFile<T>(filepath: string, data: T): Promise<void> {
  try {
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing ${filepath}:`, error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  console.log("GET /api/settings");

  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user) {
      console.error("No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    await ensureDirectories();

    // Get all settings
    const display =
      (await readJsonFile(PATHS.display, DisplaySettingsSchema)) ||
      DEFAULT_DISPLAY_SETTINGS;
    const settings =
      (await readJsonFile(PATHS.settings, UserSettingsSchema)) ||
      createDefaultUserSettings(user.id, user.email || "");
    const analytics =
      (await readJsonFile(PATHS.analytics, AnalyticsDataSchema)) ||
      createDefaultAnalyticsData(user.id);

    console.log("Settings loaded:", {
      display,
      settings: !!settings,
      analytics: !!analytics,
    });

    return NextResponse.json({ display, settings, analytics });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get settings",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("POST /api/settings - starting");

  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user) {
      console.error("No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", user.id);

    const body = await request.json();
    console.log("Request body type:", body.type);
    console.log("Request data keys:", Object.keys(body.data));

    if (body.data.gitSync) {
      console.log("Request contains gitSync data:", body.data.gitSync);
    }

    if (!body.type || !body.data) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    await ensureDirectories();

    switch (body.type) {
      case "display":
        console.log("Updating display settings");
        const displayData = DisplaySettingsSchema.parse(body.data);
        await writeJsonFile(PATHS.display, displayData);
        return NextResponse.json({ display: displayData });

      case "settings":
        console.log("Updating user settings - case entered");

        // First, read the existing settings to merge with updates
        const existingSettings =
          (await readJsonFile(PATHS.settings, UserSettingsSchema)) ||
          createDefaultUserSettings(user.id, user.email || "");

        console.log(
          "API settings route: Existing settings gitSync:",
          (existingSettings as any).gitSync,
        );
        console.log(
          "API settings route: Incoming updates gitSync:",
          (body.data as any).gitSync,
        );

        // Create a deep merged object
        const mergedSettings = {
          ...existingSettings,
          ...body.data,
          // Ensure nested objects are properly merged
          gitSync: {
            ...((existingSettings as any).gitSync || {}),
            ...((body.data as any).gitSync || {}),
          },
          preferences: {
            ...((existingSettings as any).preferences || {}),
            ...((body.data as any).preferences || {}),
          },
          tokens: {
            ...((existingSettings as any).tokens || {}),
            ...((body.data as any).tokens || {}),
          },
        };

        console.log(
          "API settings route: Merged settings gitSync:",
          mergedSettings.gitSync,
        );

        try {
          const settingsData = UserSettingsSchema.parse(mergedSettings);
          console.log("API settings route: Settings validated successfully");

          await writeJsonFile(PATHS.settings, settingsData);
          console.log("API settings route: Settings saved to file");

          console.log(
            "API settings route: Returning settings with gitSync:",
            settingsData.gitSync,
          );
          return NextResponse.json({ settings: settingsData });
        } catch (parseError) {
          console.error("API settings route: Validation error:", parseError);
          throw parseError;
        }

      case "analytics":
        console.log("Updating analytics data");
        const analyticsData = AnalyticsDataSchema.parse(body.data);
        await writeJsonFile(PATHS.analytics, analyticsData);
        return NextResponse.json({ analytics: analyticsData });

      default:
        return NextResponse.json(
          { error: "Invalid settings type" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update settings",
      },
      { status: 500 },
    );
  }
}
