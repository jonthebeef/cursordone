"use client";

import React, { useState } from "react";
import { useSettings } from "@/lib/hooks/use-settings";

// Simple placeholder component without the UI dependencies
export function GitSyncSettingsForm() {
  const { settings, updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Just a placeholder - we'll implement actual settings when UI components are properly installed
      await updateSettings({
        gitSync: {
          enabled: true,
          autoPullEnabled: true,
          autoPullInterval: 5,
          autoPushEnabled: true,
          batchCommitsThreshold: 5,
          batchCommitsTimeout: 60000,
          gitPaths: ["tasks", "epics", "docs"],
        },
      });

      alert("Settings updated successfully");
    } catch (error) {
      console.error("Failed to update Git sync settings:", error);
      alert("Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="border rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Git Synchronization</h2>
      <p className="text-gray-500 mb-6">
        Configure how your tasks, epics, and docs sync with Git
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">
            <input
              type="checkbox"
              checked={settings?.gitSync?.enabled || false}
              readOnly
              className="mr-2"
            />
            Enable Git Sync
          </label>
          <p className="text-sm text-gray-500 ml-6">
            Automatically synchronize your workspace with Git
          </p>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
