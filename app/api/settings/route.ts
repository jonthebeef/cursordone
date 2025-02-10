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
  await fs.mkdir(USER_DIR, { recursive: true });
  await fs.mkdir(ANALYTICS_DIR, { recursive: true });
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
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json({ display, settings, analytics });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, data } = await request.json();

    await ensureDirectories();

    switch (type) {
      case "display":
        const displayData = DisplaySettingsSchema.parse(data);
        await writeJsonFile(PATHS.display, displayData);
        return NextResponse.json({ display: displayData });

      case "settings":
        const settingsData = UserSettingsSchema.parse(data);
        await writeJsonFile(PATHS.settings, settingsData);
        return NextResponse.json({ settings: settingsData });

      case "analytics":
        const analyticsData = AnalyticsDataSchema.parse(data);
        await writeJsonFile(PATHS.analytics, analyticsData);
        return NextResponse.json({ analytics: analyticsData });

      default:
        return NextResponse.json(
          { error: "Invalid settings type" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
