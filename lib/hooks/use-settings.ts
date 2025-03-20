import { useState, useEffect, useCallback } from "react";
import {
  UserSettings,
  DisplaySettings,
  DEFAULT_DISPLAY_SETTINGS,
  createDefaultUserSettings,
} from "@/lib/settings/types";

interface SettingsContextValue {
  settings: UserSettings | null;
  displaySettings: DisplaySettings;
  loading: boolean;
  error: Error | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  updateDisplaySettings: (
    newSettings: Partial<DisplaySettings>,
  ) => Promise<void>;
}

// Mock data for development - in a real app this would be loaded from the backend
const MOCK_USER_ID = "user-123";
const MOCK_USER_EMAIL = "user@example.com";

export function useSettings(): SettingsContextValue {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(
    DEFAULT_DISPLAY_SETTINGS,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        // In a real app, this would be a fetch from API or local storage
        // For now, we'll use mock data
        const mockUserSettings = createDefaultUserSettings(
          MOCK_USER_ID,
          MOCK_USER_EMAIL,
        );

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        setSettings(mockUserSettings);
        setDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
        setError(null);
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load settings"),
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Update user settings
  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      if (!settings) return;

      try {
        const updatedSettings = {
          ...settings,
          ...newSettings,
        };

        // In a real app, this would be a PUT/PATCH to API or update in local storage
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        setSettings(updatedSettings);
      } catch (err) {
        console.error("Failed to update settings:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to update settings"),
        );
        throw err;
      }
    },
    [settings],
  );

  // Update display settings
  const updateDisplaySettings = useCallback(
    async (newSettings: Partial<DisplaySettings>) => {
      try {
        const updatedSettings = {
          ...displaySettings,
          ...newSettings,
        };

        // In a real app, this would be a PUT/PATCH to API or update in local storage
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        setDisplaySettings(updatedSettings);
      } catch (err) {
        console.error("Failed to update display settings:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to update display settings"),
        );
        throw err;
      }
    },
    [displaySettings],
  );

  return {
    settings,
    displaySettings,
    loading,
    error,
    updateSettings,
    updateDisplaySettings,
  };
}
