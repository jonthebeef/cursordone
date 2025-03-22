"use client";

import { useState, useEffect } from "react";
import { useSettings } from "./use-settings";

// Enhanced hook that reads repository information from settings
export function useGitSync() {
  const { settings } = useSettings();
  const [status, setStatus] = useState({
    state: "idle" as "idle" | "syncing" | "error",
    lastSync: null as Date | null,
    pendingChanges: 0,
    config: {
      enabled: false,
      repoPath: "",
      repoUrl: "",
    },
    error: null as Error | null,
  });

  // Initialize Git sync status based on settings
  useEffect(() => {
    if (settings?.gitSync) {
      setStatus((prev) => ({
        ...prev,
        config: {
          enabled: settings.gitSync.enabled,
          repoPath: settings.gitSync.repoPath || "",
          repoUrl: settings.gitSync.repoUrl || "",
        },
      }));
    }
  }, [settings]);

  // Mock function to simulate checking Git status
  const checkGitStatus = async () => {
    try {
      if (!status.config.enabled) {
        return;
      }

      if (!status.config.repoPath && !status.config.repoUrl) {
        throw new Error("No repository configured");
      }

      // This would be where actual Git operations would happen
      console.log(
        "Checking Git status for:",
        status.config.repoPath || status.config.repoUrl,
      );

      // Simulate a successful status check
      setStatus((prev) => ({
        ...prev,
        state: "idle",
        lastSync: new Date(),
        pendingChanges: Math.floor(Math.random() * 5), // Random number of changes for demo
        error: null,
      }));
    } catch (error) {
      console.error("Git status check failed:", error);
      setStatus((prev) => ({
        ...prev,
        state: "error",
        error: error instanceof Error ? error : new Error("Unknown error"),
      }));
    }
  };

  // Sync function that would perform actual Git operations
  const syncNow = async () => {
    try {
      if (!status.config.enabled) {
        console.log("Git sync is disabled");
        return;
      }

      if (!status.config.repoPath && !status.config.repoUrl) {
        throw new Error("No repository configured");
      }

      setStatus((prev) => ({ ...prev, state: "syncing" }));

      // This would be where actual Git sync operations would happen
      console.log(
        "Syncing with Git repository:",
        status.config.repoPath || status.config.repoUrl,
      );

      // Simulate some processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate a successful sync
      setStatus((prev) => ({
        ...prev,
        state: "idle",
        lastSync: new Date(),
        pendingChanges: 0,
        error: null,
      }));

      console.log("Git sync completed successfully");
    } catch (error) {
      console.error("Git sync failed:", error);
      setStatus((prev) => ({
        ...prev,
        state: "error",
        error: error instanceof Error ? error : new Error("Unknown error"),
      }));
    }
  };

  // Check Git status on initialization and when config changes
  useEffect(() => {
    if (status.config.enabled) {
      checkGitStatus();
    }
  }, [status.config]);

  return {
    status,
    syncNow,
    initialize: checkGitStatus,
    getRepoInfo: () => ({
      path: status.config.repoPath,
      url: status.config.repoUrl,
    }),
  };
}
