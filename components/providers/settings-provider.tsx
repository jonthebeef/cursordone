"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  DisplaySettings,
  UserSettings,
  AnalyticsData,
  DEFAULT_DISPLAY_SETTINGS,
  createDefaultUserSettings,
  createDefaultAnalyticsData,
} from "@/lib/settings/types";
import {
  getDisplaySettings,
  getUserSettings,
  getAnalyticsData,
  updateDisplaySettings,
  updateUserSettings,
  updateAnalyticsData,
  migrateFromSupabase,
} from "@/lib/settings/manager";

interface SettingsContextType {
  display: DisplaySettings;
  settings: UserSettings | null;
  analytics: AnalyticsData | null;
  updateDisplay: (updates: Partial<DisplaySettings>) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  updateAnalytics: (updates: Partial<AnalyticsData>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const SettingsContext = createContext<SettingsContextType>({
  display: DEFAULT_DISPLAY_SETTINGS,
  settings: null,
  analytics: null,
  updateDisplay: async () => {},
  updateSettings: async () => {},
  updateAnalytics: async () => {},
  isLoading: true,
  error: null,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient();
  const [display, setDisplay] = useState<DisplaySettings>(
    DEFAULT_DISPLAY_SETTINGS,
  );
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const [displayData, settingsData, analyticsData] = await Promise.all([
          getDisplaySettings(),
          getUserSettings(session.user.id, session.user.email || ""),
          getAnalyticsData(session.user.id),
        ]);

        setDisplay(displayData);
        setSettings(settingsData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load settings"),
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [supabase.auth]);

  // Handle migration from Supabase profile
  useEffect(() => {
    async function handleMigration() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      try {
        // First try to load existing settings
        const existingDisplay = await getDisplaySettings();
        console.log("Existing display settings:", existingDisplay);

        // Check if we need to migrate
        const needsMigration =
          !existingDisplay.avatarPath ||
          (!migrationComplete &&
            session.user.user_metadata.avatar_url &&
            !existingDisplay.avatarPath.includes(
              session.user.user_metadata.avatar_url.split("/").pop() || "",
            ));

        if (needsMigration) {
          console.log("Starting migration process...");
          await migrateFromSupabase(session.user.id, session.user.email || "", {
            full_name: session.user.user_metadata.full_name,
            name: session.user.user_metadata.name,
            avatar_url: session.user.user_metadata.avatar_url,
          });

          console.log("Migration completed, reloading settings...");
        } else {
          console.log("No migration needed, using existing settings");
          setDisplay(existingDisplay);
        }

        // Always load the latest settings
        const [displayData, settingsData, analyticsData] = await Promise.all([
          getDisplaySettings(),
          getUserSettings(session.user.id, session.user.email || ""),
          getAnalyticsData(session.user.id),
        ]);

        setDisplay(displayData);
        setSettings(settingsData);
        setAnalytics(analyticsData);
        setMigrationComplete(true);
      } catch (err) {
        console.error("Settings error:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to load/migrate settings"),
        );
      }
    }

    handleMigration();
  }, [supabase.auth]);

  const updateDisplay = async (updates: Partial<DisplaySettings>) => {
    try {
      const updated = await updateDisplaySettings(updates);
      setDisplay(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to update display settings"),
      );
      throw err;
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) throw new Error("Settings not initialized");
    try {
      const updated = await updateUserSettings(updates);
      setSettings(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to update user settings"),
      );
      throw err;
    }
  };

  const updateAnalytics = async (updates: Partial<AnalyticsData>) => {
    if (!analytics) throw new Error("Analytics not initialized");
    try {
      const updated = await updateAnalyticsData(updates);
      setAnalytics(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to update analytics data"),
      );
      throw err;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        display,
        settings,
        analytics,
        updateDisplay,
        updateSettings,
        updateAnalytics,
        isLoading,
        error,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
