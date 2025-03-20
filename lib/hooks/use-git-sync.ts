"use client";

import { useContext, useEffect } from "react";
import { GitSyncContext } from "@/lib/contexts/GitSyncContext";
import { SyncState } from "@/lib/git-sync-manager";

export function useGitSync() {
  const context = useContext(GitSyncContext);

  if (!context) {
    throw new Error("useGitSync must be used within a GitSyncProvider");
  }

  // Initialize the Git sync manager on first render
  useEffect(() => {
    if (context.initialize) {
      context.initialize().catch((error) => {
        console.error("Failed to initialize Git sync:", error);
      });
    }
  }, [context.initialize]);

  // Computed property for active state
  const isActive = () => {
    if (!context.status) return false;

    return (
      context.status.state === SyncState.PULLING ||
      context.status.state === SyncState.PUSHING ||
      context.status.state === SyncState.COMMITTING
    );
  };

  // Computed property for if sync is available
  const canSync = () => {
    if (!context.status) return false;
    return context.status.state === SyncState.IDLE;
  };

  // Computed property for if there are conflicts
  const hasConflicts = () => {
    if (!context.status) return false;
    return context.status.state === SyncState.CONFLICT;
  };

  // Computed property for if there are errors
  const hasErrors = () => {
    if (!context.status) return false;
    return context.status.state === SyncState.ERROR;
  };

  // Computed property for pending changes count
  const pendingChangesCount = () => {
    if (!context.status) return 0;
    return context.status.pendingChanges;
  };

  return {
    ...context,
    isActive: isActive(),
    canSync: canSync(),
    hasConflicts: hasConflicts(),
    hasErrors: hasErrors(),
    pendingChangesCount: pendingChangesCount(),
  };
}
