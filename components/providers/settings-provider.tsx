"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
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
  const [display, setDisplay] = useState<DisplaySettings>(
    DEFAULT_DISPLAY_SETTINGS,
  );
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Combined settings and session management
  useEffect(() => {
    let mounted = true;

    async function initializeSettings() {
      try {
        console.log("SettingsProvider: Initializing settings...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (!session?.user) {
          console.log("No session found");
          setIsLoading(false);
          return;
        }

        console.log("Session found:", {
          id: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata,
        });

        // Load existing settings first
        const [existingDisplay, existingSettings, existingAnalytics] =
          await Promise.all([
            getDisplaySettings(),
            getUserSettings(session.user.id, session.user.email || ""),
            getAnalyticsData(session.user.id),
          ]);

        console.log("SettingsProvider: Loaded settings:", {
          display: existingDisplay,
          settings: existingSettings,
          analytics: !!existingAnalytics,
          gitSync: existingSettings?.gitSync,
        });

        // Check if we have any custom settings already
        const hasCustomSettings =
          existingDisplay.displayName ||
          existingDisplay.avatarUrl ||
          existingDisplay.role ||
          existingDisplay.location;

        if (hasCustomSettings) {
          // If user has already set custom settings, always respect those
          console.log("Using existing custom display settings");
          if (mounted) setDisplay(existingDisplay);
        } else {
          // Only for new users or first-time setup, use GitHub metadata
          const metadata = session.user.user_metadata;
          if (metadata) {
            console.log(
              "No custom settings found. Setting initial values from GitHub:",
              {
                name: metadata.full_name || metadata.name,
                avatar: metadata.avatar_url,
              },
            );

            // Only use GitHub values for initial setup
            const initialDisplay = {
              ...existingDisplay,
              displayName: metadata.full_name || metadata.name,
              avatarUrl: metadata.avatar_url,
            };

            const savedDisplay = await updateDisplaySettings(initialDisplay);
            if (mounted) setDisplay(savedDisplay);
          } else {
            console.log("No GitHub metadata or custom settings found");
            if (mounted) setDisplay(existingDisplay);
          }
        }

        if (mounted) {
          setSettings(existingSettings);
          setAnalytics(existingAnalytics);
        }
      } catch (err) {
        console.error("Settings initialization error:", err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err
              : new Error("Failed to initialize settings"),
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initializeSettings();

    // Cleanup
    return () => {
      mounted = false;
    };
  }, []);

  // Auth state change listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setIsLoading(true);
        // This will trigger the main useEffect to reload settings
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateDisplay = async (updates: Partial<DisplaySettings>) => {
    try {
      console.log("Updating display settings:", updates);
      const updated = await updateDisplaySettings(updates);
      setDisplay(updated);
    } catch (err) {
      console.error("Display update error:", err);
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
      console.log(
        "SettingsProvider.updateSettings: Starting update with:",
        updates,
      );
      console.log(
        "SettingsProvider.updateSettings: Current settings:",
        settings,
      );
      console.log(
        "SettingsProvider.updateSettings: gitSync in updates:",
        updates.gitSync,
      );

      // Create a deep merge of the updates with current settings
      // This ensures nested objects like gitSync are merged properly
      const mergedSettings = {
        ...settings,
        ...updates,
        // Ensure nested objects like gitSync are properly merged
        gitSync: {
          ...(settings.gitSync || {}),
          ...(updates.gitSync || {}),
        },
        preferences: {
          ...(settings.preferences || {}),
          ...(updates.preferences || {}),
        },
        tokens: {
          ...(settings.tokens || {}),
          ...(updates.tokens || {}),
        },
      };

      console.log(
        "SettingsProvider.updateSettings: Merged settings:",
        mergedSettings,
      );
      console.log(
        "SettingsProvider.updateSettings: gitSync in merged settings:",
        mergedSettings.gitSync,
      );

      console.log(
        "SettingsProvider.updateSettings: Calling updateUserSettings...",
      );
      const updated = await updateUserSettings(mergedSettings);
      console.log(
        "SettingsProvider.updateSettings: Received updated settings:",
        updated,
      );
      console.log(
        "SettingsProvider.updateSettings: gitSync in updated settings:",
        updated.gitSync,
      );

      setSettings(updated);
      console.log(
        "SettingsProvider.updateSettings: State updated with new settings",
      );
    } catch (err) {
      console.error("SettingsProvider.updateSettings: Error:", err);
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
