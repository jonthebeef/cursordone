import React, { createContext, useContext, useEffect, useState } from "react";
import {
  GitSyncManager,
  GitSyncStatus,
  SyncState,
} from "@/lib/git-sync-manager";
import { useSettings } from "@/lib/hooks/use-settings";
import { GitSyncSettings } from "@/lib/settings/types";

interface GitSyncContextValue {
  manager: GitSyncManager | null;
  status: GitSyncStatus | null;
  initialize: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const GitSyncContext = createContext<GitSyncContextValue>({
  manager: null,
  status: null,
  initialize: async () => {},
  syncNow: async () => {},
});

export const useGitSync = () => useContext(GitSyncContext);

export function GitSyncProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [manager, setManager] = useState<GitSyncManager | null>(null);
  const [status, setStatus] = useState<GitSyncStatus | null>(null);

  // Create manager on mount
  useEffect(() => {
    if (!settings?.gitSync?.enabled) {
      if (manager) {
        manager.stop();
        setManager(null);
        setStatus(null);
      }
      return;
    }

    // Convert settings from minutes to milliseconds for the manager
    const syncConfig = {
      ...settings.gitSync,
      autoPullInterval: settings.gitSync.autoPullInterval * 60 * 1000, // Convert minutes to ms
    };

    // If no manager exists or settings have changed, create a new one
    if (!manager) {
      const newManager = new GitSyncManager(undefined, syncConfig);
      setManager(newManager);

      // Listen for status updates
      newManager.on("status", (newStatus: GitSyncStatus) => {
        setStatus(newStatus);
      });

      // Listen for errors
      newManager.on("error", (error: Error) => {
        console.error("Git sync error:", error);
      });

      // Listen for conflicts
      newManager.on("conflict", (conflictedFiles: string[]) => {
        console.warn("Git conflicts detected:", conflictedFiles);
        // Here you could trigger a UI notification for the user
      });
    } else {
      // Update existing manager config if it exists
      manager.updateConfig(syncConfig);
    }
  }, [settings, manager]);

  // Initialize the manager
  const initialize = async () => {
    if (!manager) return;
    await manager.initialize();
  };

  // Manually trigger a sync
  const syncNow = async () => {
    if (!manager) return;
    await manager.syncNow();
  };

  return (
    <GitSyncContext.Provider value={{ manager, status, initialize, syncNow }}>
      {children}
    </GitSyncContext.Provider>
  );
}
